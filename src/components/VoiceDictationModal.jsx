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

    const selectedLabel = languageNameFromCode(selectedLanguage, SUPPORTED_LANGUAGES);

    return (
      <View style={styles.languageContainer}>
        <View style={styles.languageHeaderRow}>
          <Text style={styles.languageSelectedText}>Selected: {selectedLabel}</Text>
          {showLanguagePicker ? (
            <TouchableOpacity
              onPress={() => setShowLanguagePicker(false)}
              disabled={isProcessing}
              style={styles.languageCloseButton}
            >
              <Text style={styles.languageCloseButtonText}>Close</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.languageGrid}>
          {entries.map(([code, name]) => {
            const nativeFromPrimary = PRIMARY_LANGUAGES.find((item) => item.code === code)?.native;
            const nativeLabel = nativeFromPrimary || name;
            const selected = selectedLanguage === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setSelectedLanguage(code)}
                disabled={isProcessing}
                style={[
                  styles.languagePill,
                  selected ? styles.languagePillActive : styles.languagePillInactive,
                ]}
              >
                <Text style={[styles.languageNativeText, selected ? styles.languageNativeTextActive : styles.languageNativeTextInactive]}>
                  {nativeLabel}
                </Text>
                <Text style={[styles.languageCodeText, selected ? styles.languageCodeTextActive : styles.languageCodeTextInactive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {!showLanguagePicker ? (
            <TouchableOpacity
              onPress={() => setShowLanguagePicker(true)}
              disabled={isProcessing}
              style={styles.moreLanguagesButton}
            >
              <Text style={styles.moreLanguagesTitle}>More Languages</Text>
              <Text style={styles.moreLanguagesSubtitle}>Tap to expand full list</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Voice Dictation</Text>
              <Text style={styles.modalSubtitle}>AI transcription for clinical handoff</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isProcessing} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>X</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.languageCard}>
              <Text style={styles.speakInLabel}>Speak In</Text>
              {renderLanguageButtons()}
            </View>

            <View style={styles.micCard}>
              {!isProcessing ? (
                <View style={styles.micContentWrap}>
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
                      <Text style={styles.tapToStartText}>Tap to start speaking</Text>
                      <Text style={styles.tapToStartSubtext}>Speak naturally in your selected language</Text>
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
                        <Text style={styles.partialTranscriptText}>{partialTranscript}</Text>
                      ) : null}
                      <Text style={styles.tapToStopText}>Tap mic to stop</Text>
                    </>
                  ) : null}
                </View>
              ) : (
                <View style={styles.processingWrap}>
                  <ActivityIndicator size="large" color="#0F4C81" />
                  <Text style={styles.processingTitle}>AI is processing your dictation...</Text>
                  <Text style={styles.processingSubtitle}>
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
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    marginTop: 'auto',
    height: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dragHandleWrap: {
    alignItems: 'center',
  },
  dragHandle: {
    height: 6,
    width: 56,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  modalHeader: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  languageCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE2F1',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  speakInLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#1E4B70',
  },
  languageContainer: {
    marginTop: 8,
  },
  languageHeaderRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageSelectedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  languageCloseButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  languageCloseButtonText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  languagePill: {
    minWidth: '48%',
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languagePillActive: {
    borderColor: '#0F4C81',
    backgroundColor: '#0F4C81',
  },
  languagePillInactive: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  languageNativeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  languageNativeTextActive: {
    color: '#FFFFFF',
  },
  languageNativeTextInactive: {
    color: '#1E293B',
  },
  languageCodeText: {
    marginTop: 2,
    fontSize: 10,
  },
  languageCodeTextActive: {
    color: '#D9EEFD',
  },
  languageCodeTextInactive: {
    color: '#64748B',
  },
  moreLanguagesButton: {
    minWidth: '48%',
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE2F1',
    backgroundColor: '#EAF3FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moreLanguagesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E4B70',
  },
  moreLanguagesSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: '#5A7388',
  },
  micCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE2F1',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  micContentWrap: {
    alignItems: 'center',
  },
  tapToStartText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  tapToStartSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  partialTranscriptText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748B',
  },
  tapToStopText: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
  },
  processingWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  processingTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  processingSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
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
    backgroundColor: '#BFDBFE',
  },
  mainMicButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4C81',
    shadowColor: '#0B2239',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  mainMicButtonActive: {
    backgroundColor: '#0B3E68',
  },
  mainMicIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
