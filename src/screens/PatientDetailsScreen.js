import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { FormInput, Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import { validateNotEmpty, validateAge } from '../utils';
import ImageScanner from '../../components/ImageScanner';

export const PatientDetailsScreen = ({ onNext, onBack }) => {
  const {
    state,
    setPatientName,
    setPatientID,
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
    setTransferMode,
    setTransferClinicalReason,
    setAllergyDetailsText,
    setMedicationDetailsText,
  } = useTransfer();

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!validateNotEmpty(state.patientName)) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!validateNotEmpty(state.patientID)) {
      newErrors.patientID = 'Patient ID is required';
    }

    if (!validateNotEmpty(state.patientAge)) {
      newErrors.patientAge = 'Age is required';
    } else if (!validateAge(state.patientAge)) {
      newErrors.patientAge = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleExtractedData = (data) => {
    if (!data || typeof data !== 'object') return;

    const patientObj = data.patient && typeof data.patient === 'object' ? data.patient : {};
    const criticalObj = data.critical && typeof data.critical === 'object' ? data.critical : {};
    const clinicalObj = data.clinical && typeof data.clinical === 'object' ? data.clinical : {};
    const transferObj = data.transfer && typeof data.transfer === 'object' ? data.transfer : {};
    const vitalsObj = data.vitals && typeof data.vitals === 'object' ? data.vitals : {};

    const toStringArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') return item.name || item.procedure || item.testName || '';
            return '';
          })
          .filter(Boolean);
      }
      if (typeof value === 'string') {
        return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
      }
      return [];
    };

    const toMedicationObjects = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === 'string') {
              return {
                name: item.trim(),
                dose: 'Not specified',
                route: 'Oral',
                frequency: 'As needed',
                mustNotStop: false,
              };
            }
            if (item && typeof item === 'object') {
              return {
                name: String(item.name || item.medication || '').trim(),
                dose: String(item.dose || 'Not specified').trim(),
                route: String(item.route || 'Oral').trim(),
                frequency: String(item.frequency || 'As needed').trim(),
                mustNotStop: Boolean(item.mustNotStop),
              };
            }
            return null;
          })
          .filter((item) => item && item.name);
      }
      return [];
    };

    const getFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

    const parseNumericString = (value) => {
      if (value === undefined || value === null) return '';
      const cleaned = String(value).replace(/[^0-9.]/g, '');
      return cleaned || '';
    };

    const patientName = getFirst(data.patientName, data.name, patientObj.name);
    if (patientName) {
      setPatientName(String(patientName));
    }

    const patientID = getFirst(data.patientID, data.mrn, data.id, patientObj.patientID, patientObj.id);
    if (patientID) {
      setPatientID(String(patientID));
    }

    const age = getFirst(data.age, patientObj.age);
    if (age !== null && age !== undefined && age !== '') {
      setPatientAge(String(age));
    }

    const gender = getFirst(data.gender, patientObj.gender);
    if (['Male', 'Female', 'Other'].includes(gender)) {
      setPatientGender(gender);
    }

    const dateOfBirth = getFirst(data.dateOfBirth, data.dob, patientObj.dateOfBirth);
    if (dateOfBirth) {
      setPatientDateOfBirth(String(dateOfBirth));
    }

    const phone = getFirst(data.phone, data.mobile, patientObj.phone);
    if (phone) {
      setPatientPhone(String(phone));
    }

    const address = getFirst(data.address, patientObj.address);
    if (address) {
      setPatientAddress(String(address));
    }

    const allergyList = toStringArray(getFirst(data.allergies, data.knownAllergies, criticalObj.allergies));
    if (allergyList.length > 0) {
      setAllergies(allergyList);
      setAllergyDetailsText(allergyList.map((item) => `${item} | Moderate | Unknown`).join('\n'));
    }

    const medicationObjects = toMedicationObjects(
      getFirst(data.activeMedications, data.medications, data.items, criticalObj.activeMedications)
    );
    const medicationList = medicationObjects.length > 0
      ? medicationObjects.map((item) => item.name)
      : toStringArray(getFirst(data.medications, data.activeMedications, data.items, criticalObj.activeMedications));

    if (medicationList.length > 0) {
      setMedications(medicationList);
    }

    if (medicationObjects.length > 0) {
      setMedicationDetailsText(
        medicationObjects
          .map((item) => `${item.name} | ${item.dose} | ${item.route} | ${item.frequency} | ${item.mustNotStop}`)
          .join('\n')
      );
    }

    const primaryReason = getFirst(data.transferReason, data.reason, criticalObj.transferReason, transferObj.reason);
    if (primaryReason) {
      setTransferReason(String(primaryReason));
      setTransferClinicalReason(String(primaryReason));
    }

    const primaryDiagnosis = getFirst(data.primaryDiagnosis, criticalObj.primaryDiagnosis);
    if (primaryDiagnosis) {
      setPrimaryDiagnosis(String(primaryDiagnosis));
    }

    const bloodPressure = getFirst(data.bp, data.bloodPressure, vitalsObj.bp, vitalsObj.bloodPressure);
    if (bloodPressure) {
      setVital('bloodPressure', String(bloodPressure));
    }

    const heartRate = getFirst(data.pulse, data.heartRate, vitalsObj.pulse, vitalsObj.heartRate);
    if (heartRate) {
      setVital('heartRate', parseNumericString(heartRate));
    }

    const oxygenSaturation = getFirst(data.spo2, data.oxygenSaturation, vitalsObj.spo2, vitalsObj.oxygenSaturation);
    if (oxygenSaturation) {
      setVital('oxygenSaturation', parseNumericString(oxygenSaturation));
    }

    const temperature = getFirst(data.temp, data.temperature, vitalsObj.temp, vitalsObj.temperature);
    if (temperature) {
      setVital('temperature', parseNumericString(temperature));
    }

    const respiratoryRate = getFirst(data.rr, data.respiratoryRate, vitalsObj.rr, vitalsObj.respiratoryRate);
    if (respiratoryRate) {
      setVital('respiratoryRate', parseNumericString(respiratoryRate));
    }

    const bloodGlucose = getFirst(data.bloodGlucose, data.glucose, vitalsObj.bloodGlucose);
    if (bloodGlucose) {
      setVital('bloodGlucose', parseNumericString(bloodGlucose));
    }

    const pendingInvestigations = getFirst(data.pendingInvestigations, clinicalObj.pendingInvestigations, clinicalObj.recentInvestigations);
    if (pendingInvestigations) {
      const tests = toStringArray(pendingInvestigations).join(', ');
      if (tests) setPendingInvestigations(tests);
    }

    const clinicalSummary = getFirst(data.clinicalSummary, clinicalObj.clinicalSummary);
    if (clinicalSummary) {
      setClinicalSummary(String(clinicalSummary).slice(0, 200));
    }

    const pastMedicalHistory = getFirst(data.pastMedicalHistory, clinicalObj.pastMedicalHistory);
    if (pastMedicalHistory) {
      const history = toStringArray(pastMedicalHistory).join(', ');
      if (history) setPastMedicalHistory(history);
    }

    const surgicalHistory = getFirst(data.surgicalHistory, clinicalObj.surgicalHistory);
    if (surgicalHistory) {
      const surgeries = toStringArray(surgicalHistory).join(', ');
      if (surgeries) setSurgicalHistory(surgeries);
    }

    const transferMode = getFirst(data.transferMode, transferObj.mode);
    if (['Ambulance', 'Flight', 'Self', 'Other'].includes(transferMode)) {
      setTransferMode(transferMode);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Details</Text>
          <Text style={styles.subtitle}>Screen 1/6 - Basic Information</Text>
        </View>

        <Card style={styles.formCard}>
          <ImageScanner onExtracted={handleExtractedData} formStep="patient" />

          <FormInput
            label="Sending Hospital"
            placeholder="Your hospital"
            value={state.sendingFacility.name}
            editable={false}
          />

          <FormInput
            label="Patient Name"
            placeholder="Enter patient full name"
            value={state.patientName}
            onChangeText={setPatientName}
            error={errors.patientName}
            required
          />

          <FormInput
            label="Patient ID / MRN"
            placeholder="Enter patient ID or MRN"
            value={state.patientID}
            onChangeText={setPatientID}
            error={errors.patientID}
            required
          />

          <FormInput
            label="Age"
            placeholder="Enter age in years"
            value={state.patientAge}
            onChangeText={setPatientAge}
            error={errors.patientAge}
            keyboardType="numeric"
            required
          />
        </Card>

        <Card style={styles.infoCard} shadow="none">
          <Text style={styles.infoText}>
            ⏱️ ~30 seconds to fill
          </Text>
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
  infoCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
