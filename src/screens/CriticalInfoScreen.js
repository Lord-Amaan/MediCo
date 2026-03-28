import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { FormInput, Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import { validateNotEmpty } from '../utils';

export const CriticalInfoScreen = ({ onNext, onBack }) => {
  const {
    state,
    addAllergy,
    removeAllergy,
    addMedication,
    removeMedication,
    setTransferReason,
  } = useTransfer();

  const [allergyInput, setAllergyInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (state.allergies.length === 0) {
      newErrors.allergies = 'Please enter at least one allergy or note "None"';
    }

    if (state.medications.length === 0) {
      newErrors.medications = 'Please enter at least one medication or note "None"';
    }

    if (!validateNotEmpty(state.transferReason)) {
      newErrors.transferReason = 'Transfer reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      addAllergy(allergyInput.trim());
      setAllergyInput('');
    }
  };

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      addMedication(medicationInput.trim());
      setMedicationInput('');
    }
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
          <Text style={styles.title}>Critical Information</Text>
          <Text style={styles.subtitle}>Screen 2/5 - Medical Details</Text>
        </View>

        <Card style={styles.formCard}>
          {/* Allergies Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ ALLERGIES *</Text>

            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter allergy..."
                value={allergyInput}
                onChangeText={setAllergyInput}
                placeholderTextColor={COLORS.textHint}
              />
              <Button
                title="Add"
                onPress={handleAddAllergy}
                variant="primary"
                size="sm"
              />
            </View>

            {errors.allergies && (
              <Text style={styles.errorText}>{errors.allergies}</Text>
            )}

            <View style={styles.tagsContainer}>
              {state.allergies.map((allergy, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{allergy}</Text>
                  <TouchableOpacity
                    onPress={() => removeAllergy(index)}
                    style={styles.tagRemove}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Medications Section */}
          <View style={[styles.section, { marginTop: SPACING.lg }]}>
            <Text style={styles.sectionTitle}>💊 MEDICATIONS *</Text>

            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter medication..."
                value={medicationInput}
                onChangeText={setMedicationInput}
                placeholderTextColor={COLORS.textHint}
              />
              <Button
                title="Add"
                onPress={handleAddMedication}
                variant="primary"
                size="sm"
              />
            </View>

            {errors.medications && (
              <Text style={styles.errorText}>{errors.medications}</Text>
            )}

            <View style={styles.tagsContainer}>
              {state.medications.map((medication, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{medication}</Text>
                  <TouchableOpacity
                    onPress={() => removeMedication(index)}
                    style={styles.tagRemove}
                  >
                    <Text style={styles.tagRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Transfer Reason Section */}
          <View style={[styles.section, { marginTop: SPACING.lg }]}>
            <FormInput
              label="🚑 TRANSFER REASON"
              placeholder="Why is patient being transferred?"
              value={state.transferReason}
              onChangeText={setTransferReason}
              error={errors.transferReason}
              multiline
              numberOfLines={4}
              required
            />
          </View>
        </Card>

        <Card style={styles.infoCard} shadow="none">
          <Text style={styles.infoText}>
            ⏱️ ~1 minute to fill
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight: '500',
  },
  tagRemove: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.sm,
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
