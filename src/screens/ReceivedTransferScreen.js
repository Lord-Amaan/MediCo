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
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import TransferHistoryScreen from './TransferHistoryScreen';

const ReceivedTransferScreen = ({ transferData, onClose, onAcknowledge }) => {
  const { api } = useAuth();
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallPhone = width < 375;
  const isPhone = width >= 375 && width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLarge = width >= 900;

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
      <ScrollView style={[styles.container, isTablet && styles.containerTablet, isLarge && styles.containerLarge]}>
        {/* CRITICAL INFORMATION - SURFACED PROMINENTLY */}
        <View style={[styles.criticalSection, isSmallPhone && styles.criticalSectionSmall]}>
          <View style={styles.criticalHeader}>
            <MaterialIcons name="warning" size={24} color="#fff" />
            <Text style={[styles.criticalTitle, isSmallPhone && styles.criticalTitleSmall]}>CRITICAL INFORMATION</Text>
          </View>

          {/* Allergies Card */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#ef4444', borderLeftWidth: 4 }, isSmallPhone && styles.criticalCardSmall]}>
            <Text style={[styles.criticalCardTitle, isSmallPhone && styles.criticalCardTitleSmall]}>Known Allergies</Text>
            {transfer.critical?.allergies && transfer.critical.allergies.length > 0 ? (
              transfer.critical.allergies.map((allergy, i) => (
                <Text key={i} style={[styles.criticalCardValue, isSmallPhone && styles.criticalCardValueSmall]}>
                  • {allergy.name || allergy}
                </Text>
              ))
            ) : (
              <Text style={[styles.criticalCardValue, isSmallPhone && styles.criticalCardValueSmall]}>No known allergies</Text>
            )}
          </Card>

          {/* Critical Medications - Must Not Stop */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }, isSmallPhone && styles.criticalCardSmall]}>
            <Text style={[styles.criticalCardTitle, isSmallPhone && styles.criticalCardTitleSmall]}>Medications (MUST NOT STOP)</Text>
            {transfer.critical?.activeMedications && transfer.critical.activeMedications.length > 0 ? (
              transfer.critical.activeMedications
                .filter((med) => med.mustNotStop)
                .map((med, i) => (
                  <Text key={i} style={[styles.criticalCardValue, isSmallPhone && styles.criticalCardValueSmall]}>
                    • {med.name || med} - {med.dose} {med.route} {med.frequency}
                  </Text>
                ))
            ) : (
              <Text style={[styles.criticalCardValue, isSmallPhone && styles.criticalCardValueSmall]}>No critical medications</Text>
            )}
          </Card>

          {/* Transfer Reason */}
          <Card style={[styles.criticalCard, { borderLeftColor: '#06b6d4', borderLeftWidth: 4 }, isSmallPhone && styles.criticalCardSmall]}>
            <Text style={[styles.criticalCardTitle, isSmallPhone && styles.criticalCardTitleSmall]}>Transfer Reason</Text>
            <Text style={[styles.criticalCardValue, isSmallPhone && styles.criticalCardValueSmall]}>{transfer.critical?.transferReason || transfer.transfer?.reason || 'N/A'}</Text>
          </Card>
        </View>

        {/* Patient Information */}
        <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
          <Text style={[styles.sectionTitle, isSmallPhone && styles.sectionTitleSmall, isTablet && styles.sectionTitleTablet]}>Patient Information</Text>
          <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
            <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>Name:</Text>
            <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{transfer.patient?.name || 'N/A'}</Text>
          </View>
          <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
            <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>ID (MRN):</Text>
            <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{transfer.patient?.patientID || 'N/A'}</Text>
          </View>
          <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
            <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>Age:</Text>
            <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{transfer.patient?.age || 'N/A'}</Text>
          </View>
          <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
            <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>Gender:</Text>
            <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{transfer.patient?.gender || 'N/A'}</Text>
          </View>
          {transfer.patient?.dateOfBirth && (
            <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
              <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>DOB:</Text>
              <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{new Date(transfer.patient.dateOfBirth).toLocaleDateString('en-IN')}</Text>
            </View>
          )}
          {transfer.patient?.phone && (
            <View style={[styles.row, isSmallPhone && styles.rowSmall]}>
              <Text style={[styles.label, isSmallPhone && styles.labelSmall]}>Phone:</Text>
              <Text style={[styles.value, isSmallPhone && styles.valueSmall]}>{transfer.patient.phone}</Text>
            </View>
          )}
        </Card>

        {/* PATIENT VERIFICATION - Safety Check */}
        <Card style={[styles.verificationCard, isSmallPhone && styles.verificationCardSmall, isTablet && styles.verificationCardTablet]}>
          <View style={styles.verificationHeader}>
            <MaterialIcons name="verified-user" size={24} color="#059669" />
            <Text style={[styles.verificationTitle, isSmallPhone && styles.verificationTitleSmall]}>Patient Verification Required</Text>
          </View>
          <Text style={[styles.verificationText, isSmallPhone && styles.verificationTextSmall]}>
            Before proceeding, please verify this is the correct patient by checking:
          </Text>
          <View style={styles.verificationChecklist}>
            <Text style={[styles.checklistItem, isSmallPhone && styles.checklistItemSmall]}>
              Patient name matches: <Text style={styles.bold}>{transfer.patient?.name}</Text>
            </Text>
            <Text style={[styles.checklistItem, isSmallPhone && styles.checklistItemSmall]}>
              MRN matches: <Text style={styles.bold}>{transfer.patient?.patientID}</Text>
            </Text>
            {transfer.patient?.dateOfBirth && (
              <Text style={[styles.checklistItem, isSmallPhone && styles.checklistItemSmall]}>
                Date of birth matches: <Text style={styles.bold}>{new Date(transfer.patient.dateOfBirth).toLocaleDateString('en-IN')}</Text>
              </Text>
            )}
            <Text style={[styles.checklistItem, isSmallPhone && styles.checklistItemSmall]}>
              Age matches: <Text style={styles.bold}>{transfer.patient?.age} years</Text>
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
              {patientVerified ? 'Patient Verified' : 'I verify this is the correct patient'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Clinical Summary */}
        {transfer.clinical?.summary && (
          <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
            <Text style={[styles.sectionTitle, isSmallPhone && styles.sectionTitleSmall, isTablet && styles.sectionTitleTablet]}>Clinical Summary</Text>
            <Text style={[styles.summaryText, isSmallPhone && styles.summaryTextSmall]}>{transfer.clinical.summary}</Text>
          </Card>
        )}

        {/* Vitals */}
        {transfer.vitals && Object.keys(transfer.vitals).length > 0 && (
          <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
            <Text style={[styles.sectionTitle, isSmallPhone && styles.sectionTitleSmall, isTablet && styles.sectionTitleTablet]}>Last Vitals</Text>
            <View style={[styles.vitalGrid, isSmallPhone && styles.vitalGridSmall]}>
              {transfer.vitals.bloodPressure && (
                <View style={[styles.vitalItem, isSmallPhone && styles.vitalItemSmall]}>
                  <Text style={[styles.vitalLabel, isSmallPhone && styles.vitalLabelSmall]}>BP</Text>
                  <Text style={[styles.vitalValue, isSmallPhone && styles.vitalValueSmall]}>{transfer.vitals.bloodPressure}</Text>
                </View>
              )}
              {transfer.vitals.pulse && (
                <View style={[styles.vitalItem, isSmallPhone && styles.vitalItemSmall]}>
                  <Text style={[styles.vitalLabel, isSmallPhone && styles.vitalLabelSmall]}>Pulse</Text>
                  <Text style={[styles.vitalValue, isSmallPhone && styles.vitalValueSmall]}>{transfer.vitals.pulse}</Text>
                </View>
              )}
              {transfer.vitals.spo2 && (
                <View style={[styles.vitalItem, isSmallPhone && styles.vitalItemSmall]}>
                  <Text style={[styles.vitalLabel, isSmallPhone && styles.vitalLabelSmall]}>SpO₂</Text>
                  <Text style={[styles.vitalValue, isSmallPhone && styles.vitalValueSmall]}>{transfer.vitals.spo2}</Text>
                </View>
              )}
              {transfer.vitals.temperature && (
                <View style={[styles.vitalItem, isSmallPhone && styles.vitalItemSmall]}>
                  <Text style={[styles.vitalLabel, isSmallPhone && styles.vitalLabelSmall]}>Temp</Text>
                  <Text style={[styles.vitalValue, isSmallPhone && styles.vitalValueSmall]}>{transfer.vitals.temperature}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionButtons, isSmallPhone && styles.actionButtonsSmall, isTablet && styles.actionButtonsTablet]}>
          <Button
            title="View Transfer History"
            onPress={() => setShowHistory(true)}
            variant="secondary"
            size="lg"
          />
          <Button
            title={patientVerified ? "Acknowledge Receipt" : "Verify Patient First"}
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
    backgroundColor: '#F2F7FA',
  },
  containerTablet: {
    paddingHorizontal: SPACING.xl,
  },
  containerLarge: {
    paddingHorizontal: SPACING.xxl,
  },
  criticalSection: {
    backgroundColor: '#7a2c2c',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  criticalSectionSmall: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginLeft: SPACING.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  criticalTitleSmall: {
    fontSize: 14,
    letterSpacing: 0.3,
    marginLeft: SPACING.sm,
  },
  criticalCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  criticalCardSmall: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  criticalCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  criticalCardTitleSmall: {
    fontSize: 11,
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  criticalCardValue: {
    fontSize: 12,
    color: '#0E4A7C',
    lineHeight: 20,
    marginVertical: SPACING.xs,
    fontWeight: '500',
  },
  criticalCardValueSmall: {
    fontSize: 11,
    lineHeight: 18,
    marginVertical: 2,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E7F4',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  cardSmall: {
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  cardTablet: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E4A7C',
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionTitleSmall: {
    fontSize: 13,
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  sectionTitleTablet: {
    fontSize: 18,
    marginBottom: SPACING.lg,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#C2E1F6',
  },
  rowSmall: {
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A7388',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 13,
    color: '#0E4A7C',
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 12,
  },
  summaryText: {
    fontSize: 13,
    color: '#0E4A7C',
    lineHeight: 20,
    fontWeight: '500',
  },
  summaryTextSmall: {
    fontSize: 12,
    lineHeight: 18,
  },
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vitalGridSmall: {
    gap: SPACING.sm,
  },
  vitalItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#E8F1F8',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C2E1F6',
  },
  vitalItemSmall: {
    minWidth: 80,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  vitalLabel: {
    fontSize: 11,
    color: '#5A7388',
    fontWeight: '700',
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  vitalLabelSmall: {
    fontSize: 10,
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E4A7C',
  },
  vitalValueSmall: {
    fontSize: 14,
  },
  verificationCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E7F4',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  verificationCardSmall: {
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  verificationCardTablet: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E4A7C',
    marginLeft: SPACING.sm,
    letterSpacing: 0.3,
  },
  verificationTitleSmall: {
    fontSize: 12,
    marginLeft: SPACING.xs,
    letterSpacing: 0.2,
  },
  verificationText: {
    fontSize: 12,
    color: '#5A7388',
    marginBottom: SPACING.md,
    fontWeight: '500',
    lineHeight: 18,
  },
  verificationTextSmall: {
    fontSize: 11,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  verificationChecklist: {
    marginBottom: SPACING.md,
  },
  checklistItem: {
    fontSize: 12,
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  checklistItemSmall: {
    fontSize: 11,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
    color: '#0E4A7C',
  },
  verificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: '#0E4A7C',
    borderRadius: 8,
    backgroundColor: '#F8FCFF',
  },
  verificationButtonChecked: {
    backgroundColor: '#0E4A7C',
    borderColor: '#0E4A7C',
  },
  verificationButtonText: {
    marginLeft: SPACING.md,
    fontSize: 13,
    fontWeight: '700',
    color: '#0E4A7C',
    letterSpacing: 0.2,
  },
  verificationButtonTextChecked: {
    color: '#FFFFFF',
  },
  actionButtons: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  actionButtonsSmall: {
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonsTablet: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    gap: SPACING.lg,
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
