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

export const PatientDetailsScreen = ({ onNext, onBack }) => {
  const {
    state,
    setPatientName,
    setPatientID,
    setPatientAge,
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Details</Text>
          <Text style={styles.subtitle}>Screen 1/5 - Basic Information</Text>
        </View>

        <Card style={styles.formCard}>
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
