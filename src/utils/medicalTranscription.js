import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_KEY);

const fallbackResponse = (rawText) => ({
  translatedText: rawText,
  clinicalSummary: rawText,
  detectedLanguageName: 'English',
  wasTranslated: false,
  extractedFields: {},
  correctionsMade: [],
  confidence: 'Low',
});

const buildPrompt = (rawText, detectedLanguage) => `
You are a medical transcription AI for Indian hospitals.
A doctor has just dictated a patient transfer summary.

Detected language: ${detectedLanguage}
Raw transcribed text: "${rawText}"

Perform ALL of these tasks in one response:

TASK 1 - TRANSLATE:
If the text is not in English, translate it to English.
Preserve all medical terms, drug names, and clinical details.
If already English, use as-is.

TASK 2 - CORRECT MEDICAL TERMINOLOGY:
Fix any speech recognition errors in:
- Drug names (e.g. "labia tall" → "Labetalol")
- Medical terms (e.g. "tax a cardia" → "Tachycardia") 
- Dosages (e.g. "five milligram" → "5mg")
- Vital signs (e.g. "bp one eighty over one ten" → "BP 180/110")
- Units (e.g. "ninety eight percent" → "98%")

TASK 3 - GENERATE CLINICAL SUMMARY:
Rewrite as a professional clinical summary under 200 words.
Use standard medical documentation style.
Include: presenting complaint, relevant history, 
current status, reason for transfer.
Write in third person (e.g. "Patient presents with...")

TASK 4 - EXTRACT FORM FIELDS:
Extract any patient information mentioned in the speech.
Only extract if clearly mentioned — do not guess.

Return ONLY this exact JSON structure.
No markdown, no backticks, no explanation:

{
  "translatedText": "English translation of raw text",
  "clinicalSummary": "professional clinical summary under 200 words",
  "detectedLanguageName": "English name of detected language",
  "wasTranslated": true or false,
  "extractedFields": {
    "patientName": null or "string if mentioned",
    "age": null or number if mentioned,
    "gender": null or "Male/Female/Other if mentioned",
    "primaryDiagnosis": null or "string if mentioned",
    "transferReason": null or "string if mentioned",
    "allergies": [] or ["allergy1"] if mentioned,
    "medications": [] or [{"name":"","dose":"","route":""}] if mentioned,
    "sendingHospital": null or "string if mentioned",
    "receivingHospital": null or "string if mentioned",
    "bp": null or "string like 180/110 if mentioned",
    "pulse": null or number if mentioned,
    "spo2": null or number if mentioned
  },
  "correctionsMade": ["list of corrections made"],
  "confidence": "High/Medium/Low"
}
`;

const parseJsonResponse = (responseText, rawText) => {
  const cleanedText = String(responseText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (jsonError) {
    return fallbackResponse(rawText);
  }
};

async function medicalTranscribe(rawText, detectedLanguage) {
  try {
    const prompt = buildPrompt(rawText, detectedLanguage);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    return parseJsonResponse(responseText, rawText);
  } catch (error) {
    return fallbackResponse(rawText);
  }
}

async function medicalTranscribeFromAudio(base64Audio, mimeType = 'audio/m4a') {
  try {
    const prompt = buildPrompt('[Audio input from doctor dictation]', 'auto-detect');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const responseText = response.text();
    return parseJsonResponse(responseText, '');
  } catch (error) {
    return fallbackResponse('');
  }
}

export { medicalTranscribe, medicalTranscribeFromAudio };
