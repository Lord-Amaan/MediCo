import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';
import { useAuth } from '../context/AuthContext';
import { generateShareLink, encodeTransferData } from '../utils';
import useNetworkStatus from '../hooks/useNetworkStatus';
import useOfflineSync from '../hooks/useOfflineSync';
import { encodeRecordForQR } from '../utils/encodeRecord';
import { generateOfflineId } from '../utils/generateOfflineId';
import OfflineStatusBar from '../components/OfflineStatusBar';

export const QRDisplayScreen = ({ onDone, onBack }) => {
  const { state, setQRCode, setShareLink, setTransferID, resetForm } = useTransfer();
  const { api } = useAuth();
  const { isOnline } = useNetworkStatus();
  const {
    pendingCount,
    isSyncing,
    syncError,
    savePendingTransfer,
    syncPendingTransfers,
    repairPendingTransfers,
    resetFailedTransfers,
  } = useOfflineSync();

  const [qrDataString, setQrDataString] = useState(null);
  const [shareLinkState, setShareLinkState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferData, setTransferData] = useState(null);
  const [mode, setMode] = useState('online');

  useEffect(() => {
    generateAndDisplayQR();
  }, []);

  const parseAllergies = () => {
    if (state.allergyDetailsText?.trim()) {
      return state.allergyDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, severity, reaction] = line.split('|').map((item) => item?.trim());
          return {
            name: name || 'Unknown',
            severity: ['Mild', 'Moderate', 'Severe'].includes(severity) ? severity : 'Moderate',
            reaction: reaction || 'Unknown',
          };
        });
    }

    return (state.allergies || []).map((allergy) => ({
      name: allergy,
      severity: 'Moderate',
      reaction: 'Unknown',
    }));
  };

  const parseMedications = () => {
    if (state.medicationDetailsText?.trim()) {
      return state.medicationDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, dose, route, frequency, mustNotStop] = line.split('|').map((item) => item?.trim());
          return {
            name: name || 'Unknown',
            dose: dose || 'Not specified',
            route: ['Oral', 'IV', 'Injection', 'Topical', 'Inhaled'].includes(route) ? route : 'Oral',
            frequency: frequency || 'As needed',
            mustNotStop: (mustNotStop || '').toLowerCase() === 'true',
          };
        });
    }

    return (state.medications || []).map((med) => ({
      name: med,
      dose: 'Not specified',
      route: 'Oral',
      frequency: 'As needed',
    }));
  };

  const generateAndDisplayQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const isNetworkFailure = (err) => {
        if (!err) return false;
        // No HTTP response usually means network/DNS/timeout/client connectivity issue.
        if (!err.response) return true;
        const status = err.response?.status;
        // Gateway/server unreachable style errors can safely fallback to offline.
        return status === 502 || status === 503 || status === 504;
      };

      // Generate unique transferID
      const transferID = `TXF_${Date.now()}`;
      setTransferID(transferID);

      // Build transfer payload in the format expected by backend
      const transferPayload = {
        patient: {
          name: state.patientName,
          patientID: state.patientID,
          age: parseInt(state.patientAge) || 0,
          gender: state.patientGender || undefined,
          dateOfBirth: state.patientDateOfBirth || undefined,
          phone: state.patientPhone || undefined,
          address: state.patientAddress || undefined,
        },
        critical: {
          allergies: parseAllergies(),
          activeMedications: parseMedications(),
          transferReason: state.transferReason,
          primaryDiagnosis: state.primaryDiagnosis || undefined,
        },
        vitals: {
          bloodPressure: state.vitals?.bloodPressure || undefined,
          heartRate: state.vitals?.heartRate ? parseInt(state.vitals.heartRate) : undefined,
          respiratoryRate: state.vitals?.respiratoryRate ? parseInt(state.vitals.respiratoryRate) : undefined,
          temperature: state.vitals?.temperature ? parseFloat(state.vitals.temperature) : undefined,
          oxygenSaturation: state.vitals?.oxygenSaturation ? parseInt(state.vitals.oxygenSaturation) : undefined,
          bloodGlucose: state.vitals?.bloodGlucose ? parseInt(state.vitals.bloodGlucose) : undefined,
        },
        clinical: {
          recentInvestigations: state.pendingInvestigations
            ? state.pendingInvestigations.split(',').map((test) => ({ testName: test.trim() })).filter((item) => item.testName)
            : [],
          pastMedicalHistory: state.pastMedicalHistory
            ? state.pastMedicalHistory.split(',').map((item) => item.trim()).filter(Boolean)
            : [],
          surgicalHistory: state.surgicalHistory
            ? state.surgicalHistory.split(',').map((item) => ({ procedure: item.trim() })).filter((item) => item.procedure)
            : [],
          clinicalSummary: state.clinicalSummary || undefined,
        },
        sendingFacility: {
          hospitalID: state.sendingFacility?._id || state.sendingFacility?.hospitalID || state.sendingFacility?.id,
          hospitalName: state.sendingFacility?.name,
          department: 'General',
        },
        receivingFacility: {
          hospitalID: state.receivingFacility?._id || state.receivingFacility?.hospitalID || state.receivingFacility?.id,
          hospitalName: state.receivingFacility?.name,
          department: state.receivingFacility?.city,
        },
        transfer: {
          mode: state.transferMode || undefined,
          reason: state.transferClinicalReason || undefined,
          medicalEscort: state.medicalEscort,
          escort: state.medicalEscort
            ? {
                name: state.escortName || undefined,
                qualification: state.escortQualification || undefined,
              }
            : undefined,
        },
      };

      const offlineRecordBase = {
        ...transferPayload,
        offlineId: await generateOfflineId(),
        transferId: transferID,
        createdAt: new Date().toISOString(),
        patient: {
          ...transferPayload.patient,
          name: transferPayload.patient?.name,
          age: transferPayload.patient?.age,
          gender: transferPayload.patient?.gender,
        },
        allergies: (state.allergies || []).slice(),
        medications: parseMedications(),
        transferReason: state.transferReason,
        primaryDiagnosis: state.primaryDiagnosis,
        clinicalSummary: state.clinicalSummary,
        sendingHospital: state.sendingFacility?.name,
        receivingHospital: state.receivingFacility?.name,
      };

      const handleOfflineSave = async () => {
        await savePendingTransfer(offlineRecordBase);

        const encodedRecord = encodeRecordForQR(offlineRecordBase);
        if (!encodedRecord) {
          throw new Error('Failed to encode offline record');
        }

        setMode('offline');
        setTransferData({ transferID: offlineRecordBase.offlineId, patient: offlineRecordBase.patient });
        setQrDataString(encodedRecord);
        setQRCode(encodedRecord);
        setShareLinkState(null);
        setShareLink(null);
        setTransferID(offlineRecordBase.offlineId);
      };

      if (isOnline) {
        try {
          console.log('📤 Online mode detected. Submitting transfer to backend...');
          const response = await api.post('/transfers', transferPayload);

          if (response.data && response.data.transfer) {
            console.log('✅ Transfer created:', response.data.transfer.transferID);
            setMode('online');
            setTransferData(response.data.transfer);

            const qrData = encodeTransferData({
              ...state,
              transferID: response.data.transfer.transferID,
            });
            setQrDataString(qrData);
            setQRCode(qrData);

            const link = generateShareLink(response.data.transfer.transferID);
            setShareLinkState(link);
            setShareLink(link);
          } else {
            throw new Error('No transfer data returned from backend');
          }
        } catch (serverError) {
          if (isNetworkFailure(serverError)) {
            console.log('⚠️ Network-level submit failure. Falling back to offline mode:', serverError?.message || serverError);
            await handleOfflineSave();
          } else {
            // Validation/auth/business errors should be shown, not forced into offline flow.
            const status = serverError?.response?.status;
            const message = serverError?.response?.data?.error || serverError?.message || 'Failed to create transfer';
            throw new Error(`${message}${status ? ` (Status: ${status})` : ''}`);
          }
        }
      } else {
        console.log('📴 Offline mode detected. Saving transfer locally...');
        await handleOfflineSave();
      }
    } catch (err) {
      console.error('❌ Error creating transfer:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', JSON.stringify(err, null, 2));
      
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create transfer';
      const detailedError = `${errorMsg}${err.response?.status ? ` (Status: ${err.response.status})` : ''}`;
      
      setError(detailedError);
      Alert.alert('❌ Creation Failed', detailedError);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const transferRef = transferData?.transferID || state.transferID;
      const shareMessage = mode === 'offline'
        ? `Patient Transfer (Offline)\n\nPatient: ${state.patientName}\nOffline ID: ${transferRef}\n\nQR payload (offline encoded):\n${qrDataString}`
        : `Patient Transfer\n\nPatient: ${state.patientName}\nFrom: ${state.sendingFacility.name}\nTo: ${state.receivingFacility.name}\n\nLink: ${shareLinkState}`;

      await Share.share({
        message: shareMessage,
        title: 'Patient Transfer Information',
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDone = () => {
    resetForm();
    onDone();
  };

  const handleRepairAndSync = async () => {
    const result = await repairPendingTransfers();
    if ((result?.repaired || 0) > 0) {
      Alert.alert('Repair Complete', `Repaired ${result.repaired} pending record(s). Sync will run now.`);
      await syncPendingTransfers();
      return;
    }

    Alert.alert(
      'Repair Incomplete',
      'Could not repair pending records automatically. Please open Hospital Selection and re-select receiving hospital for new transfers.'
    );
  };

  const handleResetFailedRecords = async () => {
    const total = await resetFailedTransfers();
    Alert.alert('Records Reset', `${total} pending record(s) reset. You can retry sync now.`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating QR code...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Try Again"
            onPress={generateAndDisplayQR}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineStatusBar
        onSyncPress={syncPendingTransfers}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.title}>Transfer Created!</Text>
          <Text style={styles.subtitle}>Screen 6/6 - QR Code Ready</Text>
          {mode === 'online' && <Text style={styles.onlineBadge}>Saved to server</Text>}
        </View>

        {mode === 'offline' && (
          <Card style={styles.offlineBanner} shadow="none">
            <Text style={styles.offlineBannerTitle}>Offline Mode - Full record encoded in QR</Text>
            <Text style={styles.offlineBannerText}>Will sync to server when internet is available</Text>
          </Card>
        )}

        {/* QR Code Display */}
        {qrDataString && (
          <Card style={styles.qrCard} shadow="medium">
            <View style={styles.qrContainer}>
              <QRCode
                value={qrDataString}
                size={250}
                color={COLORS.black}
                backgroundColor={COLORS.white}
                logoBorderRadius={10}
              />
            </View>
            <Text style={styles.qrHelper}>
              {mode === 'offline'
                ? 'This QR contains the complete patient record for offline use'
                : 'Scan to share all patient data'}
            </Text>
          </Card>
        )}

        {pendingCount > 0 && isOnline && (
          <Card style={styles.pendingSyncCard} shadow="none">
            <Text style={styles.pendingSyncText}>{isSyncing ? 'Syncing now...' : `${pendingCount} record(s) pending sync`}</Text>
          </Card>
        )}

        {pendingCount > 0 && !isOnline && (
          <Card style={styles.pendingOfflineCard} shadow="none">
            <Text style={styles.pendingOfflineText}>{pendingCount} records pending sync</Text>
          </Card>
        )}

        {isOnline && pendingCount > 0 && !isSyncing && (
          <TouchableOpacity style={styles.syncNowButton} onPress={syncPendingTransfers}>
            <Text style={styles.syncNowButtonText}>Sync to Server Now</Text>
          </TouchableOpacity>
        )}

        {syncError ? (
          <Card style={styles.syncErrorCard} shadow="none">
            <Text style={styles.syncErrorText}>Sync issue: {syncError}</Text>
            <Text style={styles.syncErrorHint}>Your record is safely saved offline. Retry sync when network/auth is available.</Text>
            <TouchableOpacity style={styles.repairButton} onPress={handleRepairAndSync}>
              <Text style={styles.repairButtonText}>Repair Queue and Retry Sync</Text>
            </TouchableOpacity>
            {__DEV__ ? (
              <TouchableOpacity style={styles.resetQueueButton} onPress={handleResetFailedRecords}>
                <Text style={styles.resetQueueButtonText}>Reset Failed Records (Dev Only)</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ) : null}

        {/* Transfer Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>FROM:</Text>
            <Text style={styles.summaryValue}>{state.sendingFacility.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TO:</Text>
            <Text style={[styles.summaryValue, styles.highlightedValue]}>
              {state.receivingFacility.name} ✓
            </Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.summaryPatient}>
            Patient: {state.patientName}, {state.patientAge}
          </Text>
          <Text style={styles.summaryInfo}>Transfer Ref: {transferData?.transferID || state.transferID || 'N/A'}</Text>
          {state.allergies.length > 0 && (
            <Text style={styles.summaryWarning}>
              ⚠️ Allergies: {state.allergies.join(', ')}
            </Text>
          )}
          {state.medications.length > 0 && (
            <Text style={styles.summaryInfo}>
              💊 Meds: {state.medications.join(', ')}
            </Text>
          )}
          <Text style={styles.summaryReason}>
            Reason: {state.transferReason}
          </Text>
        </Card>

        {/* Share Link */}
        {shareLinkState && (
          <Card style={styles.linkCard} shadow="none">
            <Text style={styles.linkLabel}>Share Link:</Text>
            <Text style={styles.linkValue}>{shareLinkState}</Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
          >
            <Text style={styles.actionButtonText}>🖨️ PRINT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>📱 SHARE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
          >
            <Text style={styles.actionButtonText}>📋 COPY LINK</Text>
          </TouchableOpacity>
        </View>

        {/* Info Messages */}
        <Card style={styles.infoCard} shadow="none">
          <Text style={styles.infoTitle}>Next Steps:</Text>
          <Text style={styles.infoText}>
            ✓ Print this QR code or send the link to receiving hospital
          </Text>
          <Text style={styles.infoText}>
            ✓ Attach QR print to patient transfer folder
          </Text>
          <Text style={styles.infoText}>
            ✓ Share link via SMS/Email with ambulance team
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
          title="✓ DONE"
          onPress={handleDone}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  onlineBadge: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
    color: '#2E7D32',
    backgroundColor: '#EAF3DE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
  offlineBanner: {
    marginBottom: SPACING.lg,
    backgroundColor: '#FAEEDA',
    borderLeftWidth: 4,
    borderLeftColor: '#BA7517',
  },
  offlineBannerTitle: {
    ...TYPOGRAPHY.body2,
    color: '#8A5A00',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  offlineBannerText: {
    ...TYPOGRAPHY.caption,
    color: '#A26A00',
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  qrContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  qrHelper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pendingSyncCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#EAF3DE',
  },
  pendingSyncText: {
    ...TYPOGRAPHY.body2,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  pendingOfflineCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#FAEEDA',
  },
  pendingOfflineText: {
    ...TYPOGRAPHY.body2,
    color: '#A26A00',
    textAlign: 'center',
    fontWeight: '600',
  },
  syncNowButton: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncNowButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  syncErrorCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#FEECEC',
    borderLeftWidth: 4,
    borderLeftColor: '#C62828',
  },
  syncErrorText: {
    ...TYPOGRAPHY.body2,
    color: '#9B1C1C',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  syncErrorHint: {
    ...TYPOGRAPHY.caption,
    color: '#B91C1C',
  },
  repairButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#C62828',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  repairButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
  },
  resetQueueButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#FEECEC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C62828',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  resetQueueButtonText: {
    ...TYPOGRAPHY.caption,
    color: '#C62828',
    fontWeight: '700',
  },
  summaryCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  highlightedValue: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray300,
    marginVertical: SPACING.md,
  },
  summaryPatient: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  summaryWarning: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  summaryInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  summaryReason: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  linkCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.gray100,
  },
  linkLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  linkValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
  },
  infoTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
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
