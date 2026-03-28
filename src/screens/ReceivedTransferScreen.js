import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const ReceivedTransferScreen = ({ transferData, onClose, onAcknowledge }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detailedTransfer, setDetailedTransfer] = useState(null);

  // Fetch full transfer details if we only have shareToken
  useEffect(() => {
    if (transferData?.transferID) {
      fetchTransferDetails();
    }
  }, [transferData]);

  const fetchTransferDetails = async () => {
    try {
      const response = await api.get(`/api/transfers/${transferData.transferID}`);
      setDetailedTransfer(response.data);
    } catch (error) {
      console.error('Failed to fetch transfer details:', error);
      // Still show the embedded data from QR if API call fails (offline support)
      setDetailedTransfer(transferData);
    }
  };

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      // Acknowledge the transfer
      await api.put(`/api/transfers/${transferData.transferID}/acknowledge`);

      Alert.alert(
        'Transfer Acknowledged',
        'Patient transfer received and acknowledged.',
        [
          {
            text: 'OK',
            onPress: () => {
              onAcknowledge?.();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Acknowledgement Failed',
        error.response?.data?.error || 'Could not acknowledge transfer'
      );
    } finally {
      setLoading(false);
    }
  };

  const transfer = detailedTransfer || transferData;

  if (!transfer) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Alert Badge */}
      <View style={styles.alertBadge}>
        <Text style={styles.alertText}>⚠️ Review Patient Allergies</Text>
      </View>

      {/* Patient Information Card */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{transfer.patientName || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ID (MRN):</Text>
          <Text style={styles.value}>{transfer.patientID || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Age:</Text>
          <Text style={styles.value}>{transfer.patientAge || 'N/A'} years</Text>
        </View>
      </Card>

      {/* Allergies - CRITICAL */}
      <Card style={[styles.card, styles.criticalCard]}>
        <Text style={styles.sectionTitle}>
          ⚠️ Allergies (CRITICAL)
        </Text>
        {transfer.critical?.allergies && transfer.critical.allergies.length > 0 ? (
          transfer.critical.allergies.map((allergy, index) => (
            <View key={index} style={styles.allergyTag}>
              <Text style={styles.allergyText}>{allergy}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No known allergies reported</Text>
        )}
      </Card>

      {/* Active Medications */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Active Medications</Text>
        {transfer.critical?.medications && transfer.critical.medications.length > 0 ? (
          transfer.critical.medications.map((med, index) => (
            <View key={index} style={styles.medicationTag}>
              <Text style={styles.medicationText}>{med}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No active medications</Text>
        )}
      </Card>

      {/* Transfer Reason */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Transfer Reason</Text>
        <Text style={styles.reasonText}>
          {transfer.transferReason || 'No reason provided'}
        </Text>
      </Card>

      {/* Facility Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Facility Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>
            {transfer.sendingFacility?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>
            {transfer.receivingFacility?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sending Doctor:</Text>
          <Text style={styles.value}>
            {transfer.sendingDoctor?.name || 'Unknown'}
          </Text>
        </View>
      </Card>

      {/* Vitals if available */}
      {transfer.vitals && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Vitals</Text>
          {transfer.vitals.bloodPressure && (
            <View style={styles.row}>
              <Text style={styles.label}>BP:</Text>
              <Text style={styles.value}>{transfer.vitals.bloodPressure}</Text>
            </View>
          )}
          {transfer.vitals.heartRate && (
            <View style={styles.row}>
              <Text style={styles.label}>HR:</Text>
              <Text style={styles.value}>{transfer.vitals.heartRate} bpm</Text>
            </View>
          )}
          {transfer.vitals.respiratoryRate && (
            <View style={styles.row}>
              <Text style={styles.label}>RR:</Text>
              <Text style={styles.value}>{transfer.vitals.respiratoryRate} /min</Text>
            </View>
          )}
          {transfer.vitals.spO2 && (
            <View style={styles.row}>
              <Text style={styles.label}>SpO2:</Text>
              <Text style={styles.value}>{transfer.vitals.spO2}%</Text>
            </View>
          )}
          {transfer.vitals.temperature && (
            <View style={styles.row}>
              <Text style={styles.label}>Temperature:</Text>
              <Text style={styles.value}>{transfer.vitals.temperature}°C</Text>
            </View>
          )}
        </Card>
      )}

      {/* Transfer ID */}
      <Card style={styles.card}>
        <Text style={styles.label}>Transfer ID:</Text>
        <View style={styles.idContainer}>
          <Text style={styles.idText}>{transfer.transferID || transfer._id}</Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          label={loading ? 'Acknowledging...' : 'Acknowledge Receipt'}
          onPress={handleAcknowledge}
          disabled={loading}
          style={styles.button}
        />
        <Button
          label="Close"
          variant="secondary"
          onPress={onClose}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  alertBadge: {
    backgroundColor: COLORS.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  alertText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginBottom: SPACING.md,
  },
  criticalCard: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  allergyTag: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  allergyText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },
  medicationTag: {
    backgroundColor: COLORS.infoLight,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  medicationText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  idContainer: {
    backgroundColor: COLORS.gray1,
    padding: SPACING.md,
    borderRadius: 6,
    marginTop: SPACING.sm,
  },
  idText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    marginBottom: SPACING.md,
  },
});

export { ReceivedTransferScreen };
