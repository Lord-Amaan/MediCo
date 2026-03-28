import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { FormInput, Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';

export const ClinicalDetailsScreen = ({ onNext, onBack }) => {
  const {
    state,
    setPatientGender,
    setPatientDateOfBirth,
    setPatientPhone,
    setPatientAddress,
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

  const handleNext = () => {
    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Clinical Details</Text>
          <Text style={styles.subtitle}>Screen 3/6 - Extended Schema Fields</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Patient Identifiers (Additional)</Text>
          <FormInput
            label="Gender"
            placeholder="Male / Female / Other"
            value={state.patientGender}
            onChangeText={setPatientGender}
          />
          <FormInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={state.patientDateOfBirth}
            onChangeText={setPatientDateOfBirth}
          />
          <FormInput
            label="Patient Phone"
            placeholder="Enter contact number"
            value={state.patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
          />
          <FormInput
            label="Address"
            placeholder="Enter address"
            value={state.patientAddress}
            onChangeText={setPatientAddress}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.sectionTitle}>Diagnosis & Structured Clinical Inputs</Text>
          <FormInput
            label="Primary Diagnosis"
            placeholder="Enter primary diagnosis"
            value={state.primaryDiagnosis}
            onChangeText={setPrimaryDiagnosis}
          />
          <FormInput
            label="Allergy Details"
            placeholder="One per line: Name | Severity | Reaction"
            value={state.allergyDetailsText}
            onChangeText={setAllergyDetailsText}
            multiline
            numberOfLines={3}
          />
          <FormInput
            label="Medication Details"
            placeholder="One per line: Name | Dose | Route | Frequency | mustNotStop(true/false)"
            value={state.medicationDetailsText}
            onChangeText={setMedicationDetailsText}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.sectionTitle}>Last Vitals</Text>
          <FormInput
            label="Blood Pressure"
            placeholder="e.g. 140/90"
            value={state.vitals.bloodPressure}
            onChangeText={(value) => setVital('bloodPressure', value)}
          />
          <FormInput
            label="Heart Rate"
            placeholder="bpm"
            value={state.vitals.heartRate}
            onChangeText={(value) => setVital('heartRate', value)}
            keyboardType="numeric"
          />
          <FormInput
            label="Respiratory Rate"
            placeholder="/min"
            value={state.vitals.respiratoryRate}
            onChangeText={(value) => setVital('respiratoryRate', value)}
            keyboardType="numeric"
          />
          <FormInput
            label="Temperature"
            placeholder="deg C"
            value={state.vitals.temperature}
            onChangeText={(value) => setVital('temperature', value)}
            keyboardType="numeric"
          />
          <FormInput
            label="Oxygen Saturation"
            placeholder="%"
            value={state.vitals.oxygenSaturation}
            onChangeText={(value) => setVital('oxygenSaturation', value)}
            keyboardType="numeric"
          />
          <FormInput
            label="Blood Glucose"
            placeholder="mg/dL"
            value={state.vitals.bloodGlucose}
            onChangeText={(value) => setVital('bloodGlucose', value)}
            keyboardType="numeric"
          />

          <Text style={styles.sectionTitle}>Clinical Context</Text>
          <FormInput
            label="Pending Investigations"
            placeholder="Comma separated tests"
            value={state.pendingInvestigations}
            onChangeText={setPendingInvestigations}
          />
          <FormInput
            label="Past Medical History"
            placeholder="Comma separated"
            value={state.pastMedicalHistory}
            onChangeText={setPastMedicalHistory}
            multiline
            numberOfLines={2}
          />
          <FormInput
            label="Surgical History"
            placeholder="Comma separated procedures"
            value={state.surgicalHistory}
            onChangeText={setSurgicalHistory}
            multiline
            numberOfLines={2}
          />
          <FormInput
            label="Clinical Summary (max 200 chars)"
            placeholder="Short handoff summary"
            value={state.clinicalSummary}
            onChangeText={(text) => setClinicalSummary(text.slice(0, 200))}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charCounter}>{state.clinicalSummary.length}/200</Text>

          <Text style={styles.sectionTitle}>Transfer Logistics</Text>
          
          {/* Transfer Mode Selector */}
          <View style={styles.transferModeContainer}>
            <Text style={styles.label}>Transfer Mode</Text>
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
              />
              <FormInput
                label="Escort Qualification"
                placeholder="RN / EMT / Doctor"
                value={state.escortQualification}
                onChangeText={setEscortQualification}
              />
            </>
          ) : null}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="← BACK"
          onPress={onBack}
          variant="secondary"
          size="lg"
          style={styles.halfButton}
        />
        <Button
          title="NEXT →"
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={styles.halfButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  formCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  charCounter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  switchLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  transferModeContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  halfButton: {
    flex: 1,
  },
});
