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
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 375;
  const isPhone = width >= 375 && width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLarge = width >= 900;
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
    <View style={[styles.container, isTablet && styles.containerTablet, isLarge && styles.containerLarge]}>
      <OfflineStatusBar
        onSyncPress={syncPendingTransfers}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
      />
      <ScrollView style={styles.scrollView}>
        <View style={[styles.logoSection, isSmallPhone && styles.logoSectionSmall, isTablet && styles.logoSectionTablet]}>
          <View style={[styles.brandEmblemOuter, isTablet && styles.brandEmblemOuterTablet]}>
            <View style={[styles.brandEmblemInner, isTablet && styles.brandEmblemInnerTablet]}>
              <Text style={[styles.brandEmblemText, isTablet && styles.brandEmblemTextTablet]}>+</Text>
            </View>
            <View style={styles.brandPulseDot} />
          </View>
          <Text style={[styles.brandNameText, isSmallPhone && styles.brandNameTextSmall, isTablet && styles.brandNameTextTablet]}>MediCo</Text>
        </View>
        <View style={[styles.header, isSmallPhone && styles.headerSmall, isTablet && styles.headerTablet]}>
          <Text style={[styles.title, isSmallPhone && styles.titleSmall, isTablet && styles.titleTablet]}>Transfer Created</Text>
          <Text style={[styles.subtitle, isSmallPhone && styles.subtitleSmall, isTablet && styles.subtitleTablet]}>QR Code Ready</Text>
          {mode === 'online' && <Text style={styles.onlineBadge}>Saved to server</Text>}
        </View>

        {mode === 'offline' && (
          <Card style={[styles.offlineBanner, isSmallPhone && styles.offlineBannerSmall, isTablet && styles.offlineBannerTablet]} shadow="none">
            <Text style={[styles.offlineBannerTitle, isSmallPhone && styles.offlineBannerTitleSmall]}>Offline Mode - Full record encoded in QR</Text>
            <Text style={[styles.offlineBannerText, isSmallPhone && styles.offlineBannerTextSmall]}>Will sync to server when internet is available</Text>
          </Card>
        )}

        {/* QR Code Display */}
        {qrDataString && (
          <Card style={[styles.qrCard, isSmallPhone && styles.qrCardSmall, isTablet && styles.qrCardTablet]} shadow="medium">
            <View style={[styles.qrContainer, isSmallPhone && styles.qrContainerSmall, isTablet && styles.qrContainerTablet]}>
              <QRCode
                value={qrDataString}
                size={isSmallPhone ? 200 : isTablet ? 300 : 250}
                color="#0E4A7C"
                backgroundColor="#FFFFFF"
                logoBorderRadius={10}
              />
            </View>
            <Text style={[styles.qrHelper, isSmallPhone && styles.qrHelperSmall]}>
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
              Allergies: {state.allergies.join(', ')}
            </Text>
          )}
          {state.medications.length > 0 && (
            <Text style={styles.summaryInfo}>
              Medications: {state.medications.join(', ')}
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
        <View style={[styles.actionButtons, isSmallPhone && styles.actionButtonsSmall, isTablet && styles.actionButtonsTablet]}>
          <TouchableOpacity
            style={[styles.actionButton, isSmallPhone && styles.actionButtonSmall]}
            onPress={() => {}}
          >
            <Text style={[styles.actionButtonText, isSmallPhone && styles.actionButtonTextSmall]}>PRINT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, isSmallPhone && styles.actionButtonSmall]}
            onPress={handleShare}
          >
            <Text style={[styles.actionButtonText, isSmallPhone && styles.actionButtonTextSmall]}>SHARE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, isSmallPhone && styles.actionButtonSmall]}
            onPress={() => {}}
          >
            <Text style={[styles.actionButtonText, isSmallPhone && styles.actionButtonTextSmall]}>COPY LINK</Text>
          </TouchableOpacity>
        </View>

        {/* Info Messages */}
        <Card style={[styles.infoCard, isSmallPhone && styles.infoCardSmall, isTablet && styles.infoCardTablet]} shadow="none">
          <Text style={[styles.infoTitle, isSmallPhone && styles.infoTitleSmall, isTablet && styles.infoTitleTablet]}>Next Steps:</Text>
          <Text style={[styles.infoText, isSmallPhone && styles.infoTextSmall]}>
            Print this QR code or send the link to receiving hospital
          </Text>
          <Text style={[styles.infoText, isSmallPhone && styles.infoTextSmall]}>
            Attach QR print to patient transfer folder
          </Text>
          <Text style={[styles.infoText, isSmallPhone && styles.infoTextSmall]}>
            Share link via SMS/Email with ambulance team
          </Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, isSmallPhone && styles.footerSmall, isTablet && styles.footerTablet]}>
        <Button
          title="BACK"
          onPress={onBack}
          variant="secondary"
          size="md"
          style={styles.halfButton}
        />
        <Button
          title="DONE"
          onPress={handleDone}
          variant="primary"
          size="md"
          style={styles.halfButton}
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
  containerTablet: {
    paddingHorizontal: SPACING.xl,
  },
  containerLarge: {
    paddingHorizontal: SPACING.xxl,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.lg,
  },
  logoSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoSectionSmall: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  logoSectionTablet: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
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
    shadowColor: '#0B2239',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  brandEmblemOuterTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandEmblemText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 15,
  },
  brandEmblemTextTablet: {
    fontSize: 18,
    lineHeight: 18,
  },
  brandNameText: {
    color: '#0E4A7C',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  brandNameTextSmall: {
    fontSize: 20,
    letterSpacing: 0.1,
  },
  brandNameTextTablet: {
    fontSize: 28,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#5A7388',
    marginTop: SPACING.md,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: '#5A7388',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerSmall: {
    marginBottom: SPACING.lg,
  },
  headerTablet: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleSmall: {
    fontSize: 20,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  titleTablet: {
    fontSize: 28,
    marginBottom: SPACING.md,
    letterSpacing: 0.6,
  },
  subtitle: {
    fontSize: 13,
    color: '#5A7388',
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitleSmall: {
    fontSize: 12,
  },
  subtitleTablet: {
    fontSize: 15,
  },
  onlineBadge: {
    fontSize: 11,
    marginTop: SPACING.sm,
    color: '#2E7D32',
    backgroundColor: '#EAF3DE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
  offlineBanner: {
    marginBottom: SPACING.lg,
    backgroundColor: '#FAEEDA',
    borderLeftWidth: 4,
    borderLeftColor: '#BA7517',
    padding: SPACING.md,
    borderRadius: 8,
  },
  offlineBannerSmall: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  offlineBannerTablet: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  offlineBannerTitle: {
    fontSize: 13,
    color: '#8A5A00',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  offlineBannerTitleSmall: {
    fontSize: 12,
    marginBottom: 2,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#A26A00',
  },
  offlineBannerTextSmall: {
    fontSize: 11,
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E7F4',
    padding: SPACING.md,
    borderRadius: 12,
  },
  qrCardSmall: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  qrCardTablet: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  qrContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  qrContainerSmall: {
    width: 200,
    height: 200,
    marginBottom: SPACING.sm,
  },
  qrContainerTablet: {
    width: 300,
    height: 300,
    marginBottom: SPACING.lg,
  },
  qrHelper: {
    fontSize: 12,
    color: '#5A7388',
    textAlign: 'center',
    fontWeight: '500',
  },
  qrHelperSmall: {
    fontSize: 11,
  },
  pendingSyncCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#EAF3DE',
    padding: SPACING.md,
    borderRadius: 8,
  },
  pendingSyncText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  pendingOfflineCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#FAEEDA',
    padding: SPACING.md,
    borderRadius: 8,
  },
  pendingOfflineText: {
    fontSize: 13,
    color: '#A26A00',
    textAlign: 'center',
    fontWeight: '600',
  },
  syncNowButton: {
    marginBottom: SPACING.md,
    backgroundColor: '#0E4A7C',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncNowButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  syncErrorCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#FEECEC',
    borderLeftWidth: 4,
    borderLeftColor: '#C62828',
    padding: SPACING.md,
    borderRadius: 8,
  },
  syncErrorText: {
    fontSize: 13,
    color: '#9B1C1C',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  syncErrorHint: {
    fontSize: 11,
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
    fontSize: 11,
    color: '#FFFFFF',
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
    fontSize: 11,
    color: '#C62828',
    fontWeight: '700',
  },
  summaryCard: {
    marginBottom: SPACING.lg,
    backgroundColor: '#E8F1F8',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5E7F4',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  summaryRowSmall: {
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A7388',
    letterSpacing: 0.2,
  },
  summaryLabelSmall: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 13,
    color: '#0E4A7C',
    fontWeight: '500',
  },
  summaryValueSmall: {
    fontSize: 12,
  },
  highlightedValue: {
    color: '#0E4A7C',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#D5E7F4',
    marginVertical: SPACING.md,
  },
  summaryPatient: {
    fontSize: 13,
    color: '#0E4A7C',
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  summaryWarning: {
    fontSize: 12,
    color: '#C62828',
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  summaryInfo: {
    fontSize: 12,
    color: '#5A7388',
    marginBottom: SPACING.sm,
  },
  summaryReason: {
    fontSize: 12,
    color: '#5A7388',
    fontStyle: 'italic',
  },
  linkCard: {
    marginBottom: SPACING.lg,
    backgroundColor: '#F8FCFF',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5E7F4',
  },
  linkLabel: {
    fontSize: 11,
    color: '#5A7388',
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  linkValue: {
    fontSize: 12,
    color: '#0E4A7C',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  actionButtonsSmall: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonsTablet: {
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5E7F4',
  },
  actionButtonSmall: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E4A7C',
  },
  actionButtonTextSmall: {
    fontSize: 11,
  },
  infoCard: {
    marginBottom: SPACING.lg,
    backgroundColor: '#E8F1F8',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5E7F4',
  },
  infoCardSmall: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  infoCardTablet: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E4A7C',
    marginBottom: SPACING.md,
  },
  infoTitleSmall: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  infoTitleTablet: {
    fontSize: 16,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: 12,
    color: '#5A7388',
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  infoTextSmall: {
    fontSize: 11,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  footerSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  footerTablet: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  halfButton: {
    flex: 1,
  },
});
