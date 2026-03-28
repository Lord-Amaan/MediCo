import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import useVoiceDictation from '../hooks/useVoiceDictation';
import AutoFillPreview from './AutoFillPreview';

const PRIMARY_LANGUAGES = [
  { code: 'en-US', native: 'English' },
  { code: 'hi-IN', native: 'हिंदी' },
  { code: 'mr-IN', native: 'मराठी' },
  { code: 'ta-IN', native: 'தமிழ்' },
  { code: 'te-IN', native: 'తెలుగు' },
];

const languageNameFromCode = (code, map) => map?.[code] || code;

const confidenceColor = (confidence) => {
  if (confidence === 'High') return 'text-emerald-600';
  if (confidence === 'Medium') return 'text-amber-600';
  return 'text-red-600';
};

const wordCountColor = (count) => {
  if (count > 190) return 'text-red-600';
  if (count > 160) return 'text-amber-600';
  return 'text-emerald-600';
};

export default function VoiceDictationModal({
  visible,
  onClose,
  onConfirm,
  existingText,
}) {
  const {
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
    clearAll,
    applyTranscript,
    transcriptionMeta,
  } = useVoiceDictation();

  const [editableText, setEditableText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [appliedAutoFields, setAppliedAutoFields] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setEditableText(existingText || '');
      setShowAutoFill(false);
      setAppliedAutoFields(null);
    }
  }, [visible, existingText]);

  useEffect(() => {
    if (processedTranscript) {
      setEditableText(processedTranscript);
      setShowAutoFill(Object.keys(autoFilledFields || {}).length > 0);
    }
  }, [processedTranscript, autoFilledFields]);

  useEffect(() => {
    if (!visible) return;

    const toValue = isListening ? 1.15 : 1.07;
    const duration = isListening ? 550 : 1200;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ])
    );

    if (!isProcessing) {
      loop.start();
    }

    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: isListening ? 650 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    if (!isProcessing) {
      ringLoop.start();
    }

    return () => {
      loop.stop();
      ringLoop.stop();
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    };
  }, [isListening, isProcessing, pulseAnim, ringAnim, visible]);

  useEffect(() => {
    if (isListening && wordCount >= MAX_WORDS) {
      stopListening();
    }
  }, [isListening, wordCount, MAX_WORDS, stopListening]);

  const displayedWordCount = useMemo(
    () => String(editableText || '').trim().split(/\s+/).filter(Boolean).length,
    [editableText]
  );

  const detectedLanguageName =
    transcriptionMeta?.detectedLanguageName || languageNameFromCode(detectedLanguage, SUPPORTED_LANGUAGES);

  const selectedAutoFillCount = Object.keys(appliedAutoFields || autoFilledFields || {}).length;

  const ringStyle = {
    transform: [
      {
        scale: ringAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.45],
        }),
      },
    ],
    opacity: ringAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0],
    }),
  };

  const recordingLevelBars = useMemo(() => {
    const base = isListening ? wordCount || 1 : 1;
    return [0, 1, 2, 3, 4, 5].map((index) => {
      const value = ((base + index * 3) % 12) + 6;
      return value;
    });
  }, [isListening, wordCount]);

  const handleMainButtonPress = async () => {
    if (isProcessing) return;

    if (isListening) {
      await stopListening();
      return;
    }

    await startListening(selectedLanguage);
  };

  const handleTrim = () => {
    const trimmed = applyTranscript(editableText);
    setEditableText(trimmed);
  };

  const handleRerecord = () => {
    clearAll();
    setEditableText('');
    setShowAutoFill(false);
    setAppliedAutoFields(null);
  };

  const handleConfirm = () => {
    const summary = applyTranscript(editableText);
    const fieldsToApply = appliedAutoFields || autoFilledFields || {};
    onConfirm(summary, fieldsToApply);
  };

  const renderLanguageButtons = () => {
    const allEntries = Object.entries(SUPPORTED_LANGUAGES);
    const entries = showLanguagePicker
      ? allEntries
      : PRIMARY_LANGUAGES.map((lang) => [lang.code, languageNameFromCode(lang.code, SUPPORTED_LANGUAGES)]);

    return (
      <View className="mt-2">
        <View className="flex-row flex-wrap gap-2">
          {entries.map(([code, name]) => {
            const nativeFromPrimary = PRIMARY_LANGUAGES.find((item) => item.code === code)?.native;
            const nativeLabel = nativeFromPrimary || name;
            const selected = selectedLanguage === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setSelectedLanguage(code)}
                disabled={isProcessing}
                className={`rounded-full border px-3 py-2 ${
                  selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-gray-100'
                }`}
              >
                <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-gray-800'}`}>
                  {nativeLabel}
                </Text>
                <Text className={`text-[10px] ${selected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {!showLanguagePicker ? (
            <TouchableOpacity
              onPress={() => setShowLanguagePicker(true)}
              disabled={isProcessing}
              className="rounded-full border border-gray-300 bg-gray-100 px-3 py-2"
            >
              <Text className="text-xs font-semibold text-gray-700">More</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60">
        <View className="mt-auto h-[88%] rounded-t-[30px] bg-[#F9FBFF] px-4 pb-4 pt-3">
          <View className="items-center">
            <View className="h-1.5 w-14 rounded-full bg-slate-300" />
          </View>

          <View className="mb-3 mt-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[17px] font-bold text-slate-900">Voice Dictation</Text>
              <Text className="text-xs text-slate-500">AI transcription for clinical handoff</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isProcessing} className="h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-sm font-bold text-slate-700">X</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">Speak In</Text>
              {renderLanguageButtons()}
            </View>

            <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {!isProcessing ? (
                <View className="items-center">
                  <View style={styles.micStack}>
                    <Animated.View style={[styles.ringCircle, ringStyle]} />
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <TouchableOpacity
                        onPress={handleMainButtonPress}
                        style={[styles.mainMicButton, isListening ? styles.mainMicButtonActive : null]}
                      >
                        <Text style={styles.mainMicIcon}>MIC</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {!isListening && !processedTranscript ? (
                    <>
                      <Text className="mt-3 text-sm font-semibold text-slate-900">Tap to start speaking</Text>
                      <Text className="mt-1 text-xs text-slate-500">Speak naturally in your selected language</Text>
                    </>
                  ) : null}

                  {isListening ? (
                    <>
                      <Text className="mt-3 text-sm font-semibold text-slate-900">Listening: {wordCount} words</Text>
                      <View className="mt-2 flex-row items-end gap-1">
                        {recordingLevelBars.map((height, index) => (
                          <View key={String(index)} style={{ height, width: 5 }} className="rounded-full bg-red-400" />
                        ))}
                      </View>
                      {wordCount >= 180 && wordCount < MAX_WORDS ? (
                        <Text className="mt-2 text-xs font-medium text-amber-600">Approaching 200 word limit</Text>
                      ) : null}
                      {wordCount >= MAX_WORDS ? (
                        <Text className="mt-2 text-xs font-semibold text-red-600">Reached 200 words, stopping now...</Text>
                      ) : null}
                      {partialTranscript ? (
                        <Text className="mt-2 text-center text-xs italic text-slate-500">{partialTranscript}</Text>
                      ) : null}
                      <Text className="mt-2 text-xs text-slate-600">Tap mic to stop</Text>
                    </>
                  ) : null}
                </View>
              ) : (
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color="#0F4C81" />
                  <Text className="mt-3 text-sm font-semibold text-slate-900">AI is processing your dictation...</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {detectedLanguage !== 'en-US'
                      ? `Translating from ${detectedLanguageName}...`
                      : 'Correcting medical terminology...'}
                  </Text>
                </View>
              )}
            </View>

            {transcriptionMeta?.wasTranslated ? (
              <View className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-blue-700">Translation</Text>
                <Text className="mt-1 text-sm font-semibold text-blue-900">Translated from {detectedLanguageName} to English</Text>
                <Text className="mt-1 text-xs italic text-slate-500">{rawTranscript}</Text>
              </View>
            ) : null}

            {Array.isArray(transcriptionMeta?.correctionsMade) && transcriptionMeta.correctionsMade.length > 0 ? (
              <View className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Medical Corrections</Text>
                <Text className="mt-1 text-sm text-emerald-900">{transcriptionMeta.correctionsMade.join(', ')}</Text>
              </View>
            ) : null}

            {processedTranscript ? (
              <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-800">Clinical Summary</Text>
                  <Text className={`text-xs font-semibold ${confidenceColor(transcriptionMeta?.confidence)}`}>
                    Confidence: {transcriptionMeta?.confidence || 'Low'}
                  </Text>
                </View>

                <TextInput
                  multiline={true}
                  value={editableText}
                  onChangeText={setEditableText}
                  className="mt-2 min-h-[140px] rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900"
                  placeholder="Your dictated summary will appear here"
                  editable={!isProcessing}
                  textAlignVertical="top"
                />

                <View className="mt-2 flex-row items-center justify-between">
                  <Text className={`text-xs font-semibold ${wordCountColor(displayedWordCount)}`}>
                    {displayedWordCount}/200{displayedWordCount > 200 ? ' - Over limit' : ' words'}
                  </Text>
                  {displayedWordCount > 200 ? (
                    <TouchableOpacity onPress={handleTrim} className="rounded-full bg-red-100 px-3 py-1">
                      <Text className="text-xs font-semibold text-red-700">Trim to 200</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            {showAutoFill ? (
              <AutoFillPreview
                fields={autoFilledFields}
                onApply={(fields) => {
                  setAppliedAutoFields(fields);
                }}
                onDismiss={() => setShowAutoFill(false)}
              />
            ) : null}

            {error ? <Text className="mt-3 text-xs font-medium text-red-600">{error}</Text> : null}
          </ScrollView>

          <View className="mt-2">
            {!processedTranscript ? (
              <TouchableOpacity onPress={onClose} className="rounded-xl border border-slate-300 bg-slate-200 py-3">
                <Text className="text-center text-sm font-semibold text-slate-700">Cancel</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center gap-2">
                <TouchableOpacity onPress={handleRerecord} className="rounded-xl border border-slate-300 bg-slate-200 px-4 py-3">
                  <Text className="text-sm font-semibold text-slate-700">Re-record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={displayedWordCount > 200}
                  className={`flex-1 rounded-xl py-3 ${displayedWordCount > 200 ? 'bg-blue-300' : 'bg-blue-700'}`}
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    {selectedAutoFillCount > 0
                      ? `Use Summary + Auto-fill ${selectedAutoFillCount} fields`
                      : 'Use This Summary'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 12,
  },
  micStack: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCircle: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FCA5A5',
  },
  mainMicButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    shadowColor: '#7F1D1D',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  mainMicButtonActive: {
    backgroundColor: '#B91C1C',
  },
  mainMicIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
