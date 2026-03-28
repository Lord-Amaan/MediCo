const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let lastAIStatus = {
  status: 'not_run',
  message: 'AI check not executed yet',
  model: null,
};

function extractJSONArray(text) {
  if (!text) return '[]';

  const normalized = String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  const firstBracket = normalized.indexOf('[');
  const lastBracket = normalized.lastIndexOf(']');

  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    return '[]';
  }

  return normalized.slice(firstBracket, lastBracket + 1);
}

async function checkInteractionsAI(medications, allergies) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('[InteractionAI] GEMINI_API_KEY missing, skipping AI check');
      lastAIStatus = {
        status: 'api_key_missing',
        message: 'GEMINI_API_KEY missing, skipping AI check',
        model: null,
      };
      return [];
    }

    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
    const medicationNames = (medications || []).map((med) => med?.name).filter(Boolean);
    const allergyNames = (allergies || []).filter(Boolean);

    const prompt = `You are a clinical pharmacist checking for dangerous drug 
interactions and allergy conflicts before a patient transfer.

Patient medications: ${JSON.stringify(medicationNames)}
Patient allergies: ${JSON.stringify(allergyNames)}

Check for:
1. Dangerous drug-drug interactions
2. Drug-allergy conflicts  
3. Cross-reactive allergy risks

Rules:
- Only flag clinically significant interactions
- Do not flag interactions that require monitoring only
- Focus on interactions that could cause immediate patient harm

Return ONLY a raw JSON array.
Do not include markdown formatting.
Do not include backticks.
Do not include any explanation.
If no conflicts found return exactly: []

Each conflict object must have exactly these fields:
{
  type: Drug-Drug or Allergy-Drug,
  involved: names of drugs or drug plus allergy,
  risk: Critical or Warning,
  reason: one sentence clinical reason,
  recommendation: one sentence action to take
}`;

    console.log('[InteractionAI] Requesting AI interaction check');

    let cleanedText = '[]';
    let generationWorked = false;
    let lastModelError = null;
    let apiKeyErrorMessage = null;
    let quotaErrorMessage = null;
    let modelNotFoundMessage = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const rawText = await result.response.text();
        cleanedText = extractJSONArray(rawText);
        generationWorked = true;
        console.log(`[InteractionAI] Model used: ${modelName}`);
        lastAIStatus = {
          status: 'ok',
          message: 'AI response generated successfully',
          model: modelName,
        };
        break;
      } catch (modelError) {
        lastModelError = modelError;
        const modelErrorMessage = String(modelError?.message || 'Model error');
        if (
          modelErrorMessage.toLowerCase().includes('api key') ||
          modelErrorMessage.toLowerCase().includes('api_key_invalid') ||
          modelErrorMessage.toLowerCase().includes('expired')
        ) {
          apiKeyErrorMessage = modelErrorMessage;
        }
        if (
          modelErrorMessage.includes('429') ||
          modelErrorMessage.toLowerCase().includes('quota')
        ) {
          quotaErrorMessage = modelErrorMessage;
        }
        if (
          modelErrorMessage.includes('404') ||
          modelErrorMessage.toLowerCase().includes('not found')
        ) {
          modelNotFoundMessage = modelErrorMessage;
        }

        console.log(`[InteractionAI] Model failed: ${modelName} -> ${modelErrorMessage}`);
      }
    }

    if (!generationWorked) {
      const errorMessage = String(lastModelError?.message || 'AI generation failed');
      let status = 'failed';

      if (apiKeyErrorMessage) {
        status = 'api_key_invalid';
      } else if (quotaErrorMessage) {
        status = 'quota_exceeded';
      } else if (modelNotFoundMessage) {
        status = 'model_not_found';
      }

      lastAIStatus = {
        status,
        message: apiKeyErrorMessage || quotaErrorMessage || modelNotFoundMessage || errorMessage,
        model: null,
      };
      return [];
    }

    try {
      const parsed = JSON.parse(cleanedText);
      console.log(`[InteractionAI] Parsed AI conflicts: ${Array.isArray(parsed) ? parsed.length : 0}`);
      lastAIStatus = {
        status: 'ok',
        message: `AI parsed successfully. Conflicts: ${Array.isArray(parsed) ? parsed.length : 0}`,
        model: lastAIStatus.model,
      };
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.log('[InteractionAI] Failed to parse AI response as JSON array');
      lastAIStatus = {
        status: 'parse_failed',
        message: 'AI response could not be parsed as JSON array',
        model: lastAIStatus.model,
      };
      return [];
    }
  } catch (error) {
    console.log('[InteractionAI] AI check failed:', error.message);
    lastAIStatus = {
      status: 'failed',
      message: String(error.message || 'Unknown AI error'),
      model: null,
    };
    return [];
  }
}

function getLastAIStatus() {
  return lastAIStatus;
}

module.exports = { checkInteractionsAI, getLastAIStatus };
