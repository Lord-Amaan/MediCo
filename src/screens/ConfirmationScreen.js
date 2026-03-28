import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import { formatDate, formatTime } from '../utils';

export const ConfirmationScreen = ({ onNext, onBack }) => {
  const { state } = useTransfer();

  const handleNext = () => {
    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Confirm</Text>
          <Text style={styles.subtitle}>Screen 4/5 - Confirmation</Text>
        </View>

        {/* Sending Hospital */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📋 SENDING HOSPITAL</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hospital:</Text>
            <Text style={styles.value}>{state.sendingFacility.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>{state.sendingDoctor.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>Now</Text>
          </View>
        </Card>

        {/* Patient Information */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>👤 PATIENT INFORMATION</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{state.patientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{state.patientAge} years</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>MRN:</Text>
            <Text style={styles.value}>{state.patientID}</Text>
          </View>

          {/* Allergies */}
          {state.allergies.length > 0 && (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={[styles.label, styles.warning]}>⚠️ Allergies:</Text>
              <View>
                {state.allergies.map((allergy, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {allergy}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Medications */}
          {state.medications.length > 0 && (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>💊 Medications:</Text>
              <View>
                {state.medications.map((med, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {med}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Transfer Reason */}
          <View style={[styles.detailRow, styles.multilineRow]}>
            <Text style={styles.label}>🚑 Reason:</Text>
            <Text style={styles.value}>{state.transferReason}</Text>
          </View>
        </Card>

        {/* Receiving Hospital */}
        {state.receivingFacility && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>🏥 RECEIVING HOSPITAL</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Hospital:</Text>
              <Text style={styles.value}>{state.receivingFacility.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{state.receivingFacility.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Distance:</Text>
              <Text style={styles.value}>{state.receivingFacility.distance} km</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{state.receivingFacility.contact}</Text>
            </View>
            {state.receivingFacility.departments && (
              <View style={[styles.detailRow, styles.multilineRow]}>
                <Text style={styles.label}>Departments:</Text>
                <Text style={styles.value}>
                  {state.receivingFacility.departments.join(', ')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Confirmation Message */}
        <Card style={[styles.card, styles.confirmationCard]} shadow="none">
          <Text style={styles.confirmationText}>
            ✓ Everything correct? Proceed to generate QR code.
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="← BACK / EDIT"
          onPress={onBack}
          variant="secondary"
          size="lg"
          style={styles.halfButton}
        />
        <Button
          title="GENERATE QR →"
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
  card: {
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  multilineRow: {
    flexDirection: 'column',
  },
  label: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  value: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: SPACING.md,
  },
  warning: {
    color: COLORS.error,
  },
  listItem: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  confirmationCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  confirmationText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
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
