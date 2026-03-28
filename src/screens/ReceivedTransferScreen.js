import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import TransferHistoryScreen from './TransferHistoryScreen';

const ReceivedTransferScreen = ({ transferData, onClose, onAcknowledge }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detailedTransfer, setDetailedTransfer] = useState(null);
  const [showAcknowledgeForm, setShowAcknowledgeForm] = useState(false);
  const [arrivalNote, setArrivalNote] = useState('');
  const [discrepancies, setDiscrepancies] = useState('');
  const [patientCondition, setPatientCondition] = useState('Stable');
  const [showHistory, setShowHistory] = useState(false);
  const [patientVerified, setPatientVerified] = useState(false);

  // Fetch full transfer so we get Mongo _id (needed for acknowledgement)
  useEffect(() => {
    if (transferData?.transferID) {
      fetchTransferDetails();
    } else if (transferData) {
      setDetailedTransfer(transferData);
    }
  }, [transferData]);

  const fetchTransferDetails = async () => {
    try {
      const transferRef = transferData?.transferID;
      console.log('📥 Fetching transfer details by transferID:', transferRef);

      const response = await api.get(`/transfers/report/${transferRef}`);
      const fullTransfer = response.data?.transfer || response.data;

      console.log('✅ Full transfer fetched, _id:', fullTransfer?._id);
      setDetailedTransfer(fullTransfer);
    } catch (error) {
      console.error('⚠️ Failed to fetch transfer details:', error.message);
      console.error('⚠️ Error response:', error.response?.data);
      setDetailedTransfer(transferData);
    }
  };

  const handleSubmitAcknowledgement = async () => {
    if (!patientVerified) {
      Alert.alert('Verification Required', 'Please verify the patient identity before acknowledging');
      return;
    }

    if (!arrivalNote.trim()) {
      Alert.alert('Required', 'Please add an arrival note');
      return;
    }

    setLoading(true);
    try {
      const discrepancyList = discrepancies
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      // Get transfer using the same logic as below
      const transferObj = detailedTransfer || transferData;
      
      // Prefer MongoDB _id, fallback to transfer reference ID from QR
      const transferID = transferObj?._id || transferObj?.transfer?.transferID || transferObj?.transferID;
      
      console.log('📤 Submitting acknowledgement');
      console.log('📤 Transfer ID:', transferID);
      console.log('📤 Discrepancies:', discrepancyList);

      if (!transferID) {
        Alert.alert('Error', 'Transfer ID not found. Please try scanning QR again.');
        setLoading(false);
        return;
      }
      
      await api.post(`/transfers/${transferID}/acknowledge`, {
        arrivalNotes: arrivalNote.trim(),
        discrepancies: discrepancyList,
      });

      console.log('✅ Acknowledgement submitted successfully');
      
      Alert.alert('Success', 'Transfer acknowledged successfully', [
        {
          text: 'OK',
          onPress: () => {
            setShowAcknowledgeForm(false);
            setArrivalNote('');
            setDiscrepancies('');
            setPatientCondition('Stable');
            setPatientVerified(false);
            onAcknowledge?.();
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Acknowledgement error:', error.message);
      console.error('❌ Response data:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Could not acknowledge transfer');
    } finally {
      setLoading(false);
    }
  };

  const transfer = detailedTransfer || transferData;

  if (!transfer) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* CRITICAL INFORMATION - SURFACED PROMINENTLY */}
        <View style={styles.criticalSection}>
          <View style={styles.criticalHeader}>
            <MaterialIcons name="warning" size={24} color="#fff" />
            <Text style={styles.criticalTitle}>CRITICAL INFORMATION</Text>
          </View>

          {/* Allergies Card */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#ef4444', borderLeftWidth: 4 }]}>
            <Text style={styles.criticalCardTitle}>⚠️ Known Allergies</Text>
            {transfer.critical?.allergies && transfer.critical.allergies.length > 0 ? (
              transfer.critical.allergies.map((allergy, i) => (
                <Text key={i} style={styles.criticalCardValue}>
                  • {allergy.name || allergy}
                </Text>
              ))
            ) : (
              <Text style={styles.criticalCardValue}>No known allergies</Text>
            )}
          </Card>

          {/* Critical Medications - Must Not Stop */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }]}>
            <Text style={styles.criticalCardTitle}>💊 Medications (MUST NOT STOP)</Text>
            {transfer.critical?.activeMedications && transfer.critical.activeMedications.length > 0 ? (
              transfer.critical.activeMedications
                .filter((med) => med.mustNotStop)
                .map((med, i) => (
                  <Text key={i} style={styles.criticalCardValue}>
                    • {med.name || med} - {med.dose} {med.route} {med.frequency}
                  </Text>
                ))
            ) : (
              <Text style={styles.criticalCardValue}>No critical medications</Text>
            )}
          </Card>

          {/* Transfer Reason */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#06b6d4', borderLeftWidth: 4 }]}>
            <Text style={styles.criticalCardTitle}>🚑 Transfer Reason</Text>
            <Text style={styles.criticalCardValue}>{transfer.critical?.transferReason || transfer.transfer?.reason || 'N/A'}</Text>
          </Card>
        </View>

        {/* Patient Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{transfer.patient?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID (MRN):</Text>
            <Text style={styles.value}>{transfer.patient?.patientID || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{transfer.patient?.age || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{transfer.patient?.gender || 'N/A'}</Text>
          </View>
          {transfer.patient?.dateOfBirth && (
            <View style={styles.row}>
              <Text style={styles.label}>DOB:</Text>
              <Text style={styles.value}>{new Date(transfer.patient.dateOfBirth).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {transfer.patient?.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{transfer.patient.phone}</Text>
            </View>
          )}
        </Card>

        {/* PATIENT VERIFICATION - Safety Check */}
        <Card style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <MaterialIcons name="verified-user" size={24} color="#059669" />
            <Text style={styles.verificationTitle}>Patient Verification Required</Text>
          </View>
          <Text style={styles.verificationText}>
            ⚠️ Before proceeding, please verify this is the correct patient by checking:
          </Text>
          <View style={styles.verificationChecklist}>
            <Text style={styles.checklistItem}>
              ✓ Patient name matches: <Text style={styles.bold}>{transfer.patient?.name}</Text>
            </Text>
            <Text style={styles.checklistItem}>
              ✓ MRN matches: <Text style={styles.bold}>{transfer.patient?.patientID}</Text>
            </Text>
            {transfer.patient?.dateOfBirth && (
              <Text style={styles.checklistItem}>
                ✓ Date of birth matches: <Text style={styles.bold}>{new Date(transfer.patient.dateOfBirth).toLocaleDateString('en-IN')}</Text>
              </Text>
            )}
            <Text style={styles.checklistItem}>
              ✓ Age matches: <Text style={styles.bold}>{transfer.patient?.age} years</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.verificationButton, patientVerified && styles.verificationButtonChecked]}
            onPress={() => setPatientVerified(!patientVerified)}
          >
            <MaterialIcons
              name={patientVerified ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color={patientVerified ? '#fff' : COLORS.primary}
            />
            <Text style={[styles.verificationButtonText, patientVerified && styles.verificationButtonTextChecked]}>
              {patientVerified ? 'Patient Verified ✓' : 'I verify this is the correct patient'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Clinical Summary */}
        {transfer.clinical?.summary && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Clinical Summary</Text>
            <Text style={styles.summaryText}>{transfer.clinical.summary}</Text>
          </Card>
        )}

        {/* Vitals */}
        {transfer.vitals && Object.keys(transfer.vitals).length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Last Vitals</Text>
            <View style={styles.vitalGrid}>
              {transfer.vitals.bloodPressure && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>BP</Text>
                  <Text style={styles.vitalValue}>{transfer.vitals.bloodPressure}</Text>
                </View>
              )}
              {transfer.vitals.pulse && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Pulse</Text>
                  <Text style={styles.vitalValue}>{transfer.vitals.pulse}</Text>
                </View>
              )}
              {transfer.vitals.spo2 && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>SpO₂</Text>
                  <Text style={styles.vitalValue}>{transfer.vitals.spo2}</Text>
                </View>
              )}
              {transfer.vitals.temperature && (
                <View style={styles.vitalItem}>
                  <Text style={styles.vitalLabel}>Temp</Text>
                  <Text style={styles.vitalValue}>{transfer.vitals.temperature}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="📋 View Transfer History"
            onPress={() => setShowHistory(true)}
            variant="secondary"
            size="lg"
          />
          <Button
            title={patientVerified ? "✓ Acknowledge Receipt" : "🔒 Verify Patient First"}
            onPress={() => patientVerified && setShowAcknowledgeForm(true)}
            variant={patientVerified ? "primary" : "disabled"}
            size="lg"
            disabled={!patientVerified}
          />
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Acknowledgement Form Modal */}
      <Modal visible={showAcknowledgeForm} animationType="slide">
        <ScrollView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAcknowledgeForm(false)}>
              <MaterialIcons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Acknowledge Transfer</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            {/* Patient Condition */}
            <Card style={styles.formCard}>
              <Text style={styles.formLabel}>Patient Condition on Arrival</Text>
              <View style={styles.conditionButtons}>
                {['Stable', 'Unstable', 'Critical', 'Deteriorated'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[styles.conditionButton, patientCondition === condition && styles.conditionButtonActive]}
                    onPress={() => setPatientCondition(condition)}
                  >
                    <Text
                      style={[styles.conditionButtonText, patientCondition === condition && styles.conditionButtonTextActive]}
                    >
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Arrival Note */}
            <Card style={styles.formCard}>
              <Text style={styles.formLabel}>Arrival Note *</Text>
              <Text style={styles.formHint}>Describe patient's condition on arrival, any immediate findings</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Patient arrived conscious and alert, slight fever noted, vitals stable..."
                multiline
                numberOfLines={5}
                value={arrivalNote}
                onChangeText={setArrivalNote}
                textAlignVertical="top"
              />
            </Card>

            {/* Discrepancies */}
            <Card style={styles.formCard}>
              <Text style={styles.formLabel}>Noted Discrepancies</Text>
              <Text style={styles.formHint}>List any differences from transfer records (one per line)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Patient says medication X was discontinued last week; Patient reports different allergy history"
                multiline
                numberOfLines={4}
                value={discrepancies}
                onChangeText={setDiscrepancies}
                textAlignVertical="top"
              />
            </Card>

            {/* Submit Button */}
            <Button
              title={loading ? 'Saving...' : 'Submit Acknowledgement'}
              onPress={handleSubmitAcknowledgement}
              disabled={loading}
              variant="primary"
              size="lg"
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Transfer History Modal */}
      <Modal visible={showHistory} animationType="slide">
        <TransferHistoryScreen
          patientID={transfer.patient?.patientID || transfer.patient?.id}
          onClose={() => setShowHistory(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  criticalSection: {
    backgroundColor: '#7f1d1d',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  criticalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginLeft: SPACING.md,
  },
  criticalCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  criticalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: SPACING.sm,
  },
  criticalCardValue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginVertical: SPACING.xs,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHint,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vitalItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f3f4f6',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 14,
    color: COLORS.textHint,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtons: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  closeButton: {
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.textHint,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  formCard: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  formHint: {
    fontSize: 14,
    color: COLORS.textHint,
    marginBottom: SPACING.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f9fafb',
  },
  conditionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  conditionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  conditionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#dbeafe',
  },
  conditionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHint,
  },
  conditionButtonTextActive: {
    color: COLORS.primary,
  },
  verificationCard: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginLeft: SPACING.md,
  },
  verificationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  verificationChecklist: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
  },
  checklistItem: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  verificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  verificationButtonChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  verificationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
  verificationButtonTextChecked: {
    color: '#fff',
  },
});

export { ReceivedTransferScreen };
