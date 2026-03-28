const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const getNormalizedGeminiKey = () => {
  const raw = process.env.GEMINI_API_KEY || '';
  return raw.trim().replace(/^"|"$/g, '');
};

const commonInstruction =
  'Return ONLY raw JSON. No markdown, no backticks. Use null for missing fields.';

const sanitizeBase64 = (image) => {
  if (!image || typeof image !== 'string') return image;
  return image.replace(/^data:image\/[a-zA-Z]+;base64,/, '').trim();
};

const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Remove markdown fences if model returned them.
  const withoutFences = text.replace(/```json|```/gi, '').trim();

  // Try object JSON first.
  const objectMatch = withoutFences.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (error) {
      // Continue to array parsing.
    }
  }

  // Some prompts (like allergies/medications) may return arrays.
  const arrayMatch = withoutFences.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    try {
      return { items: JSON.parse(arrayMatch[0]) };
    } catch (error) {
      return null;
    }
  }

  return null;
};

function buildPrompt(formStep) {
  switch (formStep) {
    case 'patient':
      return `Extract ALL patient transfer data. Return EXACTLY this JSON structure (use null for missing):
{
  "patientName": "extracted name or null",
  "patientID": "extracted ID/MRN or null",
  "age": "extracted age or null",
  "gender": "Male/Female/Other or null",
  "dateOfBirth": "extracted DOB or null",
  "phone": "extracted phone or null",
  "address": "extracted address or null",
  "primaryDiagnosis": "main diagnosis or null",
  "transferReason": "why transfer or null",
  "pendingInvestigations": "pending tests or null",
  "clinicalSummary": "clinical findings (max 200 words) or null",
  "pastMedicalHistory": "medical history or null",
  "surgicalHistory": "surgical history or null",
  "transferMode": "Ambulance/Flight/Self/Other or null",
  "allergies": ["allergy1", "allergy2"] or [],
  "activeMedications": [{"name":"med1", "dose":"500mg", "route":"Oral", "frequency":"Twice daily", "mustNotStop":true}] or [],
  "vitals": {
    "bloodPressure": "120/80",
    "pulse": "72",
    "spo2": "98%",
    "temperature": "98.6",
    "rr": "16",
    "bloodGlucose": "120"
  }
}
NO OTHER TEXT. ONLY VALID JSON.`;

    case 'medications':
      return `Extract medication details. Return JSON array (use null for missing):
[{"name":"...", "dose":"...", "route":"...", "frequency":"...", "mustNotStop":true/false}]
NO OTHER TEXT. ONLY JSON.`;

    case 'vitals':
      return `Extract vital signs. Return JSON object (use null for missing):
{"bloodPressure": "120/80", "pulse": "72", "spo2": "98%", "temperature": "98.6", "rr": "16", "bloodGlucose": "120"}
NO OTHER TEXT. ONLY JSON.`;

    case 'allergies':
      return `Extract allergies. Return JSON object:
{"allergies": ["allergy1", "allergy2"]}
NO OTHER TEXT. ONLY JSON.`;

    case 'summary':
      return `Extract transfer summary. Return JSON object (use null for missing):
{"primaryDiagnosis": "...", "transferReason": "...", "pendingInvestigations": "...", "clinicalSummary": "..."}
NO OTHER TEXT. ONLY JSON.`;

    default:
      return `Extract medical transfer data. Return JSON (use null for missing):
{"patientName": "...", "patientID": "...", "age": "...", "gender": "...", "phone": "...", "address": "...", "primaryDiagnosis": "...", "transferReason": "...", "pendingInvestigations": "...", "clinicalSummary": "...", "pastMedicalHistory": "...", "surgicalHistory": "...", "transferMode": "...", "allergies": [], "activeMedications": [], "vitals": {}}
NO OTHER TEXT. ONLY JSON.`;
  }
}

router.post('/scan-report', async (req, res) => {
  try {
    const { image, formStep } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const geminiKey = getNormalizedGeminiKey();
    if (!geminiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing on server' });
    }

    if (!geminiKey.startsWith('AIza')) {
      return res.status(500).json({ error: 'Gemini API key format is invalid on server' });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const normalizedImage = sanitizeBase64(image);

    const prompt = buildPrompt(formStep);

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: normalizedImage } },
    ]);
    const text = result.response.text();

    const extracted = extractJsonFromText(text);
    if (!extracted) {
      return res.status(422).json({
        error: 'Failed to parse structured data from model response',
      });
    }

    return res.json({ extracted });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to scan report' });
  }
});

module.exports = router;
