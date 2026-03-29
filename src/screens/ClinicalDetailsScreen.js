import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { FormInput, Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import VoiceDictationModal from '../components/VoiceDictationModal';

export const ClinicalDetailsScreen = ({ onNext, onBack }) => {
  const {
    state,
    setPatientName,
    setPatientAge,
    setPatientGender,
    setPatientDateOfBirth,
    setPatientPhone,
    setPatientAddress,
    setAllergies,
    setMedications,
    setTransferReason,
    setPrimaryDiagnosis,
    setVital,
    setPendingInvestigations,
    setClinicalSummary,
    setPastMedicalHistory,
    setSurgicalHistory,
    setAllergyDetailsText,
    setMedicationDetailsText,
    setTransferMode,
    setTransferClinicalReason,
    setMedicalEscort,
    setEscortName,
    setEscortQualification,
  } = useTransfer();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLarge = width >= 1024;

  const summaryWordCount = state.clinicalSummary
    ? state.clinicalSummary.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleNext = () => {
    onNext();
  };

  const fieldProps = useMemo(() => ({
    containerStyle: styles.fieldContainer,
    labelStyle: styles.fieldLabel,
    inputStyle: styles.fieldInput,
  }), []);

  const handleBloodPressure = useCallback((value) => {
    setVital('bloodPressure', value);
  }, [setVital]);

  const handleHeartRate = useCallback((value) => {
    setVital('heartRate', value);
  }, [setVital]);

  const handleRespiratoryRate = useCallback((value) => {
    setVital('respiratoryRate', value);
  }, [setVital]);

  const handleTemperature = useCallback((value) => {
    setVital('temperature', value);
  }, [setVital]);

  const handleOxygenSaturation = useCallback((value) => {
    setVital('oxygenSaturation', value);
  }, [setVital]);

  const handleBloodGlucose = useCallback((value) => {
    setVital('bloodGlucose', value);
  }, [setVital]);

  const handleClinicalSummary = useCallback((text) => {
    setClinicalSummary(text.slice(0, 200));
  }, [setClinicalSummary]);

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <View style={[styles.brandRow, isTablet && styles.brandRowTablet, isLarge && styles.brandRowLarge]}>
          <View style={[styles.brandEmblemOuter, isTablet && styles.brandEmblemOuterTablet]}>
            <View style={styles.brandPulseDot} />
            <View style={[styles.brandEmblemInner, isTablet && styles.brandEmblemInnerTablet]}>
              <Text style={styles.brandEmblemText}>+</Text>
            </View>
          </View>
          <Text style={[styles.brandNameText, isTablet && styles.brandNameTextTablet]}>MediCo</Text>
        </View>

        <View style={[styles.headerCard, isTablet && styles.headerCardTablet, isLarge && styles.headerCardLarge]}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 3 of 6</Text>
          </View>
          <Text style={styles.title}>Clinical Details</Text>
          <Text style={styles.subtitle}>Vitals, diagnosis, context, and transfer logistics</Text>
        </View>

        <Card style={[styles.formCard, isTablet && styles.formCardTablet, isLarge && styles.formCardLarge]}>
          <Text style={styles.sectionTitle}>Patient Identifiers (Additional)</Text>
          <FormInput
            label="Gender"
            placeholder="Male / Female / Other"
            value={state.patientGender}
            onChangeText={setPatientGender}
            {...fieldProps}
          />
          <FormInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={state.patientDateOfBirth}
            onChangeText={setPatientDateOfBirth}
            {...fieldProps}
          />
          <FormInput
            label="Patient Phone"
            placeholder="Enter contact number"
            value={state.patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
            {...fieldProps}
          />
          <FormInput
            label="Address"
            placeholder="Enter address"
            value={state.patientAddress}
            onChangeText={setPatientAddress}
            multiline
            numberOfLines={2}
            {...fieldProps}
          />

          <Text style={styles.sectionTitle}>Diagnosis & Structured Clinical Inputs</Text>
          <FormInput
            label="Primary Diagnosis"
            placeholder="Enter primary diagnosis"
            value={state.primaryDiagnosis}
            onChangeText={setPrimaryDiagnosis}
            {...fieldProps}
          />
          <FormInput
            label="Allergy Details"
            placeholder="One per line: Name | Severity | Reaction"
            value={state.allergyDetailsText}
            onChangeText={setAllergyDetailsText}
            multiline
            numberOfLines={3}
            {...fieldProps}
          />
          <FormInput
            label="Medication Details"
            placeholder="One per line: Name | Dose | Route | Frequency | mustNotStop(true/false)"
            value={state.medicationDetailsText}
            onChangeText={setMedicationDetailsText}
            multiline
            numberOfLines={4}
            {...fieldProps}
          />

          <Text style={styles.sectionTitle}>Last Vitals</Text>
          <FormInput
            label="Blood Pressure"
            placeholder="e.g. 140/90"
            value={state.vitals.bloodPressure}
            onChangeText={handleBloodPressure}
            {...fieldProps}
          />
          <FormInput
            label="Heart Rate"
            placeholder="bpm"
            value={state.vitals.heartRate}
            onChangeText={handleHeartRate}
            keyboardType="numeric"
            {...fieldProps}
          />
          <FormInput
            label="Respiratory Rate"
            placeholder="/min"
            value={state.vitals.respiratoryRate}
            onChangeText={handleRespiratoryRate}
            keyboardType="numeric"
            {...fieldProps}
          />
          <FormInput
            label="Temperature"
            placeholder="deg C"
            value={state.vitals.temperature}
            onChangeText={handleTemperature}
            keyboardType="numeric"
            {...fieldProps}
          />
          <FormInput
            label="Oxygen Saturation"
            placeholder="%"
            value={state.vitals.oxygenSaturation}
            onChangeText={handleOxygenSaturation}
            keyboardType="numeric"
            {...fieldProps}
          />
          <FormInput
            label="Blood Glucose"
            placeholder="mg/dL"
            value={state.vitals.bloodGlucose}
            onChangeText={handleBloodGlucose}
            keyboardType="numeric"
            {...fieldProps}
          />

          <Text style={styles.sectionTitle}>Clinical Context</Text>
          <FormInput
            label="Pending Investigations"
            placeholder="Comma separated tests"
            value={state.pendingInvestigations}
            onChangeText={setPendingInvestigations}
            {...fieldProps}
          />
          <FormInput
            label="Past Medical History"
            placeholder="Comma separated"
            value={state.pastMedicalHistory}
            onChangeText={setPastMedicalHistory}
            multiline
            numberOfLines={2}
            {...fieldProps}
          />
          <FormInput
            label="Surgical History"
            placeholder="Comma separated procedures"
            value={state.surgicalHistory}
            onChangeText={setSurgicalHistory}
            multiline
            numberOfLines={2}
            {...fieldProps}
          />

          <View style={styles.dictationPanel}>
            <View style={styles.dictationTextBlock}>
              <Text style={styles.dictationPanelTitle}>AI Voice Dictation</Text>
              <Text style={styles.dictationPanelSubtitle}>Capture clinical summary by voice and auto-fill key details</Text>
            </View>
            <TouchableOpacity style={styles.dictationActionButton} onPress={() => setShowVoiceModal(true)}>
              <Text style={styles.dictationActionText}>Dictate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>Clinical Summary</Text>
          </View>
          <TextInput
            style={styles.summaryInput}
            placeholder="Short handoff summary"
            placeholderTextColor="#7A93A8"
            value={state.clinicalSummary}
            onChangeText={handleClinicalSummary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text
            style={[
              styles.wordCounter,
              summaryWordCount > 190
                ? styles.wordCounterHigh
                : summaryWordCount > 160
                  ? styles.wordCounterMid
                  : styles.wordCounterLow,
            ]}
          >
            {summaryWordCount}/200 words
          </Text>

          <Text style={styles.sectionTitle}>Transfer Logistics</Text>
          
          {/* Transfer Mode Selector */}
          <View style={styles.transferModeContainer}>
            <Text style={styles.label}>TRANSFER MODE</Text>
            <View style={styles.modeButtonsRow}>
              {['Ambulance', 'Flight', 'Self', 'Other'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    state.transferMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => setTransferMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      state.transferMode === mode && styles.modeButtonTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FormInput
            label="Transfer Clinical Reason (detailed)"
            placeholder="Detailed reason for escalation"
            value={state.transferClinicalReason}
            onChangeText={setTransferClinicalReason}
            multiline
            numberOfLines={2}
            {...fieldProps}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Medical Escort Required</Text>
            <Switch
              value={state.medicalEscort}
              onValueChange={setMedicalEscort}
              trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
              thumbColor={state.medicalEscort ? COLORS.primary : COLORS.gray500}
            />
          </View>

          {state.medicalEscort ? (
            <>
              <FormInput
                label="Escort Name"
                placeholder="Enter escort name"
                value={state.escortName}
                onChangeText={setEscortName}
                {...fieldProps}
              />
              <FormInput
                label="Escort Qualification"
                placeholder="RN / EMT / Doctor"
                value={state.escortQualification}
                onChangeText={setEscortQualification}
                {...fieldProps}
              />
            </>
          ) : null}
        </Card>
      </ScrollView>

      <View style={[styles.footer, isTablet && styles.footerTablet]}>
        <Button
          title="← BACK"
          onPress={onBack}
          variant="secondary"
          size="md"
          style={styles.halfButton}
          textStyle={styles.backButtonText}
        />
        <Button
          title="NEXT →"
          onPress={handleNext}
          variant="primary"
          size="md"
          style={[styles.halfButton, styles.nextButton]}
          textStyle={styles.nextButtonText}
        />
      </View>

      {showVoiceModal ? (
        <VoiceDictationModal
          visible={showVoiceModal}
          existingText={state.clinicalSummary}
          onClose={() => setShowVoiceModal(false)}
          onConfirm={(summary, autoFilledFields) => {
            setClinicalSummary(summary);

            if (autoFilledFields) {
              if (!state.patientName && autoFilledFields.patientName) {
                setPatientName(autoFilledFields.patientName);
              }
              if (!state.patientAge && autoFilledFields.age) {
                setPatientAge(String(autoFilledFields.age));
              }
              if (!state.patientGender && autoFilledFields.gender) {
                setPatientGender(autoFilledFields.gender);
              }

              if (!state.primaryDiagnosis && autoFilledFields.primaryDiagnosis) {
                setPrimaryDiagnosis(autoFilledFields.primaryDiagnosis);
              }
              if (!state.transferReason && autoFilledFields.transferReason) {
                setTransferReason(autoFilledFields.transferReason);
              }

              if ((!state.allergies || state.allergies.length === 0) && Array.isArray(autoFilledFields.allergies)) {
                setAllergies(autoFilledFields.allergies);
              }

              if ((!state.medications || state.medications.length === 0) && Array.isArray(autoFilledFields.medications)) {
                const medicationNames = autoFilledFields.medications
                  .map((med) => {
                    if (typeof med === 'string') return med;
                    return med?.name || '';
                  })
                  .filter(Boolean);
                if (medicationNames.length > 0) {
                  setMedications(medicationNames);
                }
              }

              if (!state.vitals?.bloodPressure && autoFilledFields.bp) {
                setVital('bloodPressure', autoFilledFields.bp);
              }
              if (!state.vitals?.heartRate && autoFilledFields.pulse) {
                setVital('heartRate', String(autoFilledFields.pulse));
              }
              if (!state.vitals?.oxygenSaturation && autoFilledFields.spo2) {
                setVital('oxygenSaturation', String(autoFilledFields.spo2));
              }
            }

            setShowVoiceModal(false);
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FA',
  },
  bgOrbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D2EEF4',
    top: -90,
    right: -70,
    opacity: 0.8,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFE0CC',
    bottom: -120,
    left: -110,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.lg,
  },
  scrollContentTablet: {
    alignItems: 'center',
    paddingTop: 64,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: SPACING.md,
  },
  brandRowTablet: {
    width: '92%',
    maxWidth: 760,
  },
  brandRowLarge: {
    maxWidth: 860,
  },
  brandEmblemOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0A365D',
    borderWidth: 2,
    borderColor: '#2D7FBA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmblemOuterTablet: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  brandPulseDot: {
    position: 'absolute',
    right: -2,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#59D9A5',
    borderWidth: 2,
    borderColor: '#EAF8F2',
  },
  brandEmblemInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E6EA8',
    borderWidth: 2,
    borderColor: '#D5ECFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmblemInnerTablet: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brandEmblemText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 15,
  },
  brandNameText: {
    color: '#0E4A7C',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  brandNameTextTablet: {
    fontSize: 27,
  },
  headerCard: {
    borderRadius: 18,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    backgroundColor: '#0E4A7C',
    borderWidth: 1,
    borderColor: '#C2E1F6',
    marginBottom: SPACING.sm,
  },
  headerCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  headerCardLarge: {
    maxWidth: 860,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  stepBadgeText: {
    color: '#E4F4FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 19,
    color: '#F5FBFF',
    marginBottom: 4,
    fontWeight: '900',
    letterSpacing: 0.15,
    lineHeight: 23,
  },
  subtitle: {
    fontSize: 12,
    color: '#D4E9F8',
    fontWeight: '500',
    lineHeight: 16,
    maxWidth: 320,
  },
  formCard: {
    marginBottom: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5E7F4',
    backgroundColor: '#FFFFFF',
  },
  formCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  formCardLarge: {
    maxWidth: 860,
  },
  fieldContainer: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  fieldLabel: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 0,
  },
  fieldInput: {
    fontSize: 14,
    color: '#102A43',
    fontWeight: '600',
    borderRadius: 12,
    borderColor: '#CFE0ED',
    backgroundColor: '#F8FCFF',
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#17466A',
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'none',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    marginLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2A7FBC',
    paddingLeft: 8,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: SPACING.sm,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dictateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
  },
  dictateButtonText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  dictationPanel: {
    marginHorizontal: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#CFE2F1',
    borderRadius: 14,
    backgroundColor: '#F4F9FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dictationTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  dictationPanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#184A6F',
    marginBottom: 2,
  },
  dictationPanelSubtitle: {
    fontSize: 11,
    color: '#5A7388',
    lineHeight: 15,
  },
  dictationActionButton: {
    backgroundColor: '#0F4C81',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#0F4C81',
  },
  dictationActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  summaryInput: {
    borderWidth: 1,
    borderColor: '#CFE0ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 120,
    fontSize: 14,
    fontWeight: '600',
    color: '#102A43',
    backgroundColor: '#F8FCFF',
    marginBottom: SPACING.xs,
    marginHorizontal: 16,
  },
  wordCounter: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: SPACING.md,
    marginHorizontal: 8,
    fontWeight: '600',
  },
  wordCounterLow: {
    color: COLORS.textSecondary,
  },
  wordCounterMid: {
    color: '#D97706',
  },
  wordCounterHigh: {
    color: COLORS.error,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingHorizontal: 8,
  },
  switchLabel: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  transferModeContainer: {
    marginBottom: SPACING.lg,
    paddingLeft: 22,
    paddingRight: 16,
  },
  label: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CFE0ED',
    backgroundColor: '#F8FCFF',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#0F4C81',
    borderColor: '#0F4C81',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#1E4B70',
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: 6,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    backgroundColor: 'rgba(242,247,250,0.94)',
    borderTopWidth: 1,
    borderTopColor: '#DCEAF5',
  },
  footerTablet: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 760,
  },
  halfButton: {
    flex: 1,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#1E4B70',
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  nextButton: {
    backgroundColor: '#0F4C81',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.35,
  },
});
