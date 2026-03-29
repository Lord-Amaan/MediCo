import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLarge = width >= 1024;

  const validate = () => {
    const newErrors = {};

    if (!validateNotEmpty(state.sendingFacility?.name)) {
      newErrors.sendingHospital = 'Sending hospital is required';
    }

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
            <Text style={styles.stepBadgeText}>Step 1 of 6</Text>
          </View>
          <Text style={styles.title}>Patient Details</Text>
          <Text style={styles.subtitle}>Add core patient information to start the transfer</Text>
        </View>

        <Card style={[styles.formCard, isTablet && styles.formCardTablet, isLarge && styles.formCardLarge]}>
          <View style={styles.scannerSection}>
            <ImageScanner onExtracted={handleExtractedData} formStep="patient" />
          </View>

          <FormInput
            label="Sending Hospital"
            placeholder="Your hospital"
            value={state.sendingFacility.name}
            editable={false}
            error={errors.sendingHospital}
            required
            containerStyle={styles.fieldContainer}
            labelStyle={styles.fieldLabel}
            inputStyle={styles.fieldInputDisabled}
          />

          <FormInput
            label="Patient Name"
            placeholder="Enter patient full name"
            value={state.patientName}
            onChangeText={setPatientName}
            error={errors.patientName}
            required={!state.patientName?.trim()}
            containerStyle={styles.fieldContainer}
            labelStyle={styles.fieldLabel}
            inputStyle={styles.fieldInput}
            errorStyle={styles.fieldError}
          />

          <FormInput
            label="Patient ID / MRN"
            placeholder="Enter patient ID or MRN"
            value={state.patientID}
            onChangeText={setPatientID}
            error={errors.patientID}
            required={!state.patientID?.trim()}
            containerStyle={styles.fieldContainer}
            labelStyle={styles.fieldLabel}
            inputStyle={styles.fieldInput}
            errorStyle={styles.fieldError}
          />

          <FormInput
            label="Age"
            placeholder="Enter age in years"
            value={state.patientAge}
            onChangeText={setPatientAge}
            error={errors.patientAge}
            keyboardType="numeric"
            required={!state.patientAge?.trim()}
            containerStyle={styles.fieldContainer}
            labelStyle={styles.fieldLabel}
            inputStyle={styles.fieldInput}
            errorStyle={styles.fieldError}
          />
        </Card>

        <Card style={[styles.infoCard, isTablet && styles.infoCardTablet]} shadow="none" padding={10}>
          <Text style={styles.infoText}>
            Usually takes around 30 seconds
          </Text>
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
  scannerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  formCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  formCardLarge: {
    maxWidth: 860,
  },
  fieldContainer: {
    marginBottom: 4,
    width: '100%',
    alignSelf: 'stretch',
  },
  fieldLabel: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 8,
  },
  fieldInput: {
    fontSize: 14,
    color: '#102A43',
    fontWeight: '600',
    borderRadius: 12,
    borderColor: '#CFE0ED',
    backgroundColor: '#F8FCFF',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  fieldInputDisabled: {
    fontSize: 14,
    color: '#486176',
    fontWeight: '600',
    borderRadius: 12,
    borderColor: '#D8E5F0',
    backgroundColor: '#EFF6FC',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  fieldError: {
    fontSize: 10,
    color: '#B42318',
    marginTop: 6,
    marginLeft: 8,
    paddingRight: 8,
    fontWeight: '600',
    lineHeight: 14,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E7F3',
    backgroundColor: 'rgba(255,255,255,0.72)',
    marginBottom: SPACING.sm,
  },
  infoCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  infoText: {
    fontSize: 11,
    color: '#5D7285',
    fontWeight: '600',
    textAlign: 'center',
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
