import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { FormInput, Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import { validateNotEmpty } from '../utils';
import useInteractionCheck from '../hooks/useInteractionCheck';
import DrugInteractionAlert from '../components/DrugInteractionAlert';
import useOfflineSync from '../hooks/useOfflineSync';
import OfflineStatusBar from '../components/OfflineStatusBar';

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
  const [showInteractionAlert, setShowInteractionAlert] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLarge = width >= 1024;

  const {
    conflicts,
    checking,
    hasCritical,
    hasWarnings,
    aiUsed,
    checkInteractions,
  } = useInteractionCheck();
  const { syncPendingTransfers } = useOfflineSync();

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

  const handleNext = async () => {
    if (!validate()) {
      return;
    }

    const result = await checkInteractions(
      state.medications.map((name) => ({ name })),
      state.allergies
    );

    if (result && result.totalFound > 0) {
      setShowInteractionAlert(true);
      return;
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <OfflineStatusBar onSyncPress={syncPendingTransfers} />
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
            <Text style={styles.stepBadgeText}>Step 2 of 6</Text>
          </View>
          <Text style={styles.title}>Critical Information</Text>
          <Text style={styles.subtitle}>Allergies, medications, and transfer reason</Text>
        </View>

        <Card style={[styles.formCard, isTablet && styles.formCardTablet, isLarge && styles.formCardLarge]}>
          {/* Allergies Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ALLERGIES
              {state.allergies.length === 0 && <Text style={styles.requiredStar}> *</Text>}
            </Text>

            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter allergy..."
                value={allergyInput}
                onChangeText={setAllergyInput}
                placeholderTextColor="#7A93A8"
              />
              <Button
                title="Add"
                onPress={handleAddAllergy}
                variant="primary"
                size="sm"
                style={styles.tagAddButton}
                textStyle={styles.tagAddButtonText}
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
            <Text style={styles.sectionTitle}>
              MEDICATIONS
              {state.medications.length === 0 && <Text style={styles.requiredStar}> *</Text>}
            </Text>

            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter medication..."
                value={medicationInput}
                onChangeText={setMedicationInput}
                placeholderTextColor="#7A93A8"
              />
              <Button
                title="Add"
                onPress={handleAddMedication}
                variant="primary"
                size="sm"
                style={styles.tagAddButton}
                textStyle={styles.tagAddButtonText}
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
              label="TRANSFER REASON"
              placeholder="Why is patient being transferred?"
              value={state.transferReason}
              onChangeText={setTransferReason}
              error={errors.transferReason}
              multiline
              numberOfLines={4}
              required={!state.transferReason?.trim()}
              containerStyle={styles.fieldContainer}
              labelStyle={styles.fieldLabel}
              inputStyle={styles.fieldInput}
              errorStyle={styles.fieldError}
              placeholderTextColor="#7A93A8"
            />
          </View>
        </Card>

        <Card style={[styles.infoCard, isTablet && styles.infoCardTablet]} shadow="none" padding={10}>
          <Text style={styles.infoText}>
            Usually takes around 1 minute
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
          title={checking ? 'Checking...' : 'NEXT →'}
          onPress={handleNext}
          variant="primary"
          size="md"
          style={[styles.halfButton, styles.nextButton]}
          textStyle={styles.nextButtonText}
          disabled={checking}
        />
      </View>

      <DrugInteractionAlert
        visible={showInteractionAlert}
        conflicts={conflicts}
        hasCritical={hasCritical}
        aiUsed={aiUsed}
        onGoBack={() => setShowInteractionAlert(false)}
        onContinue={() => {
          setShowInteractionAlert(false);
          onNext();
        }}
      />
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginLeft: 12,
  },
  requiredStar: {
    color: '#B42318',
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.md,
    paddingHorizontal: 0,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CFE0ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#102A43',
    backgroundColor: '#F8FCFF',
  },
  tagAddButton: {
    backgroundColor: '#0F4C81',
    borderRadius: 10,
    minWidth: 42,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  tagAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.25,
    fontSize: 11,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3FA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFE2F1',
  },
  tagText: {
    fontSize: 11,
    color: '#1E4B70',
    marginRight: SPACING.sm,
    fontWeight: '700',
  },
  tagRemove: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: '#1E4B70',
    fontWeight: '700',
    fontSize: 12,
  },
  errorText: {
    fontSize: 10,
    color: '#B42318',
    marginBottom: SPACING.sm,
    marginLeft: 8,
    paddingRight: 8,
    fontWeight: '600',
    lineHeight: 14,
  },
  fieldContainer: {
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
