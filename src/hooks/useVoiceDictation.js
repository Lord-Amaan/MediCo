import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { medicalTranscribe, medicalTranscribeFromAudio } from '../utils/medicalTranscription';

const SUPPORTED_LANGUAGES = {
  'en-US': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'pa-IN': 'Punjabi',
};

const MAX_WORDS = 200;

export default function useVoiceDictation() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [processedTranscript, setProcessedTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');
  const [wordCount, setWordCount] = useState(0);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [error, setError] = useState(null);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [transcriptionMeta, setTranscriptionMeta] = useState({
    translatedText: '',
    detectedLanguageName: 'English',
    wasTranslated: false,
    correctionsMade: [],
    confidence: 'Low',
  });

  const rawTranscriptRef = useRef('');
  const recordingRef = useRef(null);

  const languageNameToCode = useCallback((languageName) => {
    const value = String(languageName || '').toLowerCase();
    const byName = Object.entries(SUPPORTED_LANGUAGES).find(([, label]) =>
      label.toLowerCase() === value
    );
    if (byName?.[0]) return byName[0];
    return 'en-US';
  }, []);

  const detectLanguage = useCallback((text) => {
    const value = String(text || '');

    if (/[\u0900-\u097F]/.test(value)) return 'hi-IN';
    if (/[\u0980-\u09FF]/.test(value)) return 'bn-IN';
    if (/[\u0B80-\u0BFF]/.test(value)) return 'ta-IN';
    if (/[\u0C00-\u0C7F]/.test(value)) return 'te-IN';
    if (/[\u0A80-\u0AFF]/.test(value)) return 'gu-IN';
    if (/[\u0C80-\u0CFF]/.test(value)) return 'kn-IN';
    if (/[\u0D00-\u0D7F]/.test(value)) return 'ml-IN';

    return 'en-US';
  }, []);

  const processTranscript = useCallback(
    async (text) => {
      try {
        setIsProcessing(true);
        const language = detectLanguage(text);
        setDetectedLanguage(language);

        const result = await medicalTranscribe(text, language);
        const nextSummary = String(result?.clinicalSummary || text || '');
        const words = nextSummary.trim().split(/\s+/).filter(Boolean);

        setProcessedTranscript(nextSummary);
        setAutoFilledFields(result?.extractedFields || {});
        setWordCount(words.length);
        setTranscriptionMeta({
          translatedText: String(result?.translatedText || ''),
          detectedLanguageName: String(result?.detectedLanguageName || SUPPORTED_LANGUAGES[language] || 'English'),
          wasTranslated: Boolean(result?.wasTranslated),
          correctionsMade: Array.isArray(result?.correctionsMade) ? result.correctionsMade : [],
          confidence: String(result?.confidence || 'Low'),
        });
      } catch (processingError) {
        const fallbackText = String(text || '');
        const words = fallbackText.trim().split(/\s+/).filter(Boolean);

        setProcessedTranscript(fallbackText);
        setWordCount(words.length);
      } finally {
        setIsProcessing(false);
      }
    },
    [detectLanguage]
  );

  const processAudio = useCallback(
    async (base64Audio, mimeType = 'audio/m4a') => {
      try {
        setIsProcessing(true);
        const result = await medicalTranscribeFromAudio(base64Audio, mimeType);
        const nextSummary = String(result?.clinicalSummary || '');
        const translatedText = String(result?.translatedText || '');
        const words = nextSummary.trim().split(/\s+/).filter(Boolean);
        const languageCode = languageNameToCode(result?.detectedLanguageName);

        rawTranscriptRef.current = translatedText;
        setRawTranscript(translatedText);
        setProcessedTranscript(nextSummary);
        setAutoFilledFields(result?.extractedFields || {});
        setWordCount(words.length);
        setDetectedLanguage(languageCode);
        setTranscriptionMeta({
          translatedText,
          detectedLanguageName: String(result?.detectedLanguageName || SUPPORTED_LANGUAGES[languageCode] || 'English'),
          wasTranslated: Boolean(result?.wasTranslated),
          correctionsMade: Array.isArray(result?.correctionsMade) ? result.correctionsMade : [],
          confidence: String(result?.confidence || 'Low'),
        });
      } catch (audioProcessingError) {
        setError('Could not process recorded audio. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [languageNameToCode]
  );

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
            recordingRef.current = null;
          }
        } catch (cleanupError) {
          // no-op: cleanup best effort
        }
      };
      cleanup();
    };
  }, []);

  const startListening = useCallback(async (preferredLanguage = 'en-US') => {
    if (isListening) return;

    setRawTranscript('');
    setProcessedTranscript('');
    setPartialTranscript('');
    setError(null);
    setAutoFilledFields({});
    setWordCount(0);
    setTranscriptionMeta({
      translatedText: '',
      detectedLanguageName: 'English',
      wasTranslated: false,
      correctionsMade: [],
      confidence: 'Low',
    });
    rawTranscriptRef.current = '';

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission?.granted) {
        setError('Microphone permission is required for dictation.');
        setIsListening(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setDetectedLanguage(preferredLanguage || 'en-US');
      setPartialTranscript('Recording in progress...');
      setIsListening(true);
    } catch (startError) {
      setError('Microphone could not start. Please check permission and try again.');
      setIsListening(false);
      console.log('Audio start error:', startError);
    }
  }, [isListening]);

  const stopListening = useCallback(async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) {
        setIsListening(false);
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsListening(false);

      if (!uri) {
        setError('Recording failed to save. Please try again.');
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setPartialTranscript('');
      await processAudio(base64, 'audio/m4a');

      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        // no-op: temporary file cleanup best effort
      }
    } catch (stopError) {
      setIsListening(false);
      setError('Could not stop recording. Please try again.');
      console.log('Audio stop error:', stopError);
    }
  }, [processAudio]);

  const clearAll = useCallback(() => {
    setIsListening(false);
    setIsProcessing(false);
    setRawTranscript('');
    setProcessedTranscript('');
    setDetectedLanguage('en-US');
    setWordCount(0);
    setAutoFilledFields({});
    setError(null);
    setPartialTranscript('');
    setTranscriptionMeta({
      translatedText: '',
      detectedLanguageName: 'English',
      wasTranslated: false,
      correctionsMade: [],
      confidence: 'Low',
    });
    rawTranscriptRef.current = '';

    const clearRecording = async () => {
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
        }
      } catch (clearError) {
        // no-op: clear best effort
      }
    };
    clearRecording();
  }, []);

  const applyTranscript = useCallback((editedText) => {
    const words = String(editedText || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      return String(editedText || '').trim();
    }
    return words.slice(0, MAX_WORDS).join(' ');
  }, []);

  return {
    isListening,
    isProcessing,
    rawTranscript,
    processedTranscript,
    detectedLanguage,
    wordCount,
    autoFilledFields,
    error,
    partialTranscript,
    SUPPORTED_LANGUAGES,
    MAX_WORDS,
    startListening,
    stopListening,
    processTranscript,
    clearAll,
    applyTranscript,
    transcriptionMeta,
  };
}
