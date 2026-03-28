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
          <Text style={styles.subtitle}>Screen 5/6 - Confirmation</Text>
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

          {state.patientGender ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.value}>{state.patientGender}</Text>
            </View>
          ) : null}
          {state.patientDateOfBirth ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>DOB:</Text>
              <Text style={styles.value}>{state.patientDateOfBirth}</Text>
            </View>
          ) : null}
          {state.patientPhone ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{state.patientPhone}</Text>
            </View>
          ) : null}
          {state.patientAddress ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{state.patientAddress}</Text>
            </View>
          ) : null}

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

          {state.primaryDiagnosis ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>🩺 Primary Diagnosis:</Text>
              <Text style={styles.value}>{state.primaryDiagnosis}</Text>
            </View>
          ) : null}

          {(state.vitals?.bloodPressure || state.vitals?.heartRate || state.vitals?.respiratoryRate || state.vitals?.temperature || state.vitals?.oxygenSaturation || state.vitals?.bloodGlucose) ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>📊 Vitals:</Text>
              <View>
                {state.vitals.bloodPressure ? <Text style={styles.listItem}>• BP: {state.vitals.bloodPressure}</Text> : null}
                {state.vitals.heartRate ? <Text style={styles.listItem}>• HR: {state.vitals.heartRate}</Text> : null}
                {state.vitals.respiratoryRate ? <Text style={styles.listItem}>• RR: {state.vitals.respiratoryRate}</Text> : null}
                {state.vitals.temperature ? <Text style={styles.listItem}>• Temp: {state.vitals.temperature}</Text> : null}
                {state.vitals.oxygenSaturation ? <Text style={styles.listItem}>• SpO2: {state.vitals.oxygenSaturation}%</Text> : null}
                {state.vitals.bloodGlucose ? <Text style={styles.listItem}>• Glucose: {state.vitals.bloodGlucose}</Text> : null}
              </View>
            </View>
          ) : null}

          {state.pendingInvestigations ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>🧪 Pending Tests:</Text>
              <Text style={styles.value}>{state.pendingInvestigations}</Text>
            </View>
          ) : null}

          {state.clinicalSummary ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>📝 Clinical Summary:</Text>
              <Text style={styles.value}>{state.clinicalSummary}</Text>
            </View>
          ) : null}

          {state.transferMode ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>🚐 Transfer Mode:</Text>
              <Text style={styles.value}>{state.transferMode}</Text>
            </View>
          ) : null}
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
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{state.receivingFacility.city}, {state.receivingFacility.state}</Text>
            </View>
            {state.receivingFacility.contact && state.receivingFacility.contact.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{state.receivingFacility.contact.phone}</Text>
              </View>
            )}
            {state.receivingFacility.departments && state.receivingFacility.departments.length > 0 && (
              <View style={[styles.detailRow, styles.multilineRow]}>
                <Text style={styles.label}>Departments:</Text>
                <Text style={styles.value}>
                  {state.receivingFacility.departments.map(d => d.name || d).join(', ')}
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
