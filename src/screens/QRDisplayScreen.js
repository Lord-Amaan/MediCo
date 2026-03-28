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

export const QRDisplayScreen = ({ onDone, onBack }) => {
  const { state, setQRCode, setShareLink, setTransferID, resetForm } = useTransfer();
  const { api, state: authState } = useAuth();

  const [qrDataString, setQrDataString] = useState(null);
  const [shareLinkState, setShareLinkState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferData, setTransferData] = useState(null);

  useEffect(() => {
    generateAndDisplayQR();
  }, []);

  const generateAndDisplayQR = async () => {
    try {
      setLoading(true);

      // Generate unique transferID
      const transferID = `TXF_${Date.now()}`;
      setTransferID(transferID);

      // Build transfer payload in the format expected by backend
      const transferPayload = {
        patient: {
          name: state.patientName,
          patientID: state.patientID,
          age: parseInt(state.patientAge) || 0,
        },
        critical: {
          // Convert simple string allergies to objects
          allergies: (state.allergies || []).map(allergy => ({
            name: allergy,
            severity: 'Moderate',
            reaction: 'Unknown',
          })),
          // Convert simple string medications to objects
          activeMedications: (state.medications || []).map(med => ({
            name: med,
            dose: 'Not specified',
            route: 'Oral',
            frequency: 'As needed',
          })),
          transferReason: state.transferReason,
        },
        sendingFacility: {
          hospitalID: state.sendingFacility?._id || state.sendingFacility?.hospitalID,
          hospitalName: state.sendingFacility?.name,
          department: 'General',
        },
        receivingFacility: {
          hospitalID: state.receivingFacility?._id,
          hospitalName: state.receivingFacility?.name,
          department: state.receivingFacility?.city,
        },
      };

      // Create transfer in backend
      console.log('📤 Submitting transfer to backend:', transferPayload);
      const response = await api.post('/transfers', transferPayload);
      
      if (response.data && response.data.transfer) {
        console.log('✅ Transfer created:', response.data.transfer.transferID);
        setTransferData(response.data.transfer);

        // Encode transfer data to JSON string for QR (use backend ID)
        const qrData = encodeTransferData({
          ...state,
          transferID: response.data.transfer.transferID,
        });
        setQrDataString(qrData);
        setQRCode(qrData);

        // Generate share link with backend ID
        const link = generateShareLink(response.data.transfer.transferID);
        setShareLinkState(link);
        setShareLink(link);
      } else {
        throw new Error('No transfer data returned from backend');
      }

      setError(null);
    } catch (err) {
      console.error('❌ Error creating transfer:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create transfer';
      setError(errorMsg);
      Alert.alert('Creation Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Patient Transfer\n\nPatient: ${state.patientName}\nFrom: ${state.sendingFacility.name}\nTo: ${state.receivingFacility.name}\n\nLink: ${shareLinkState}`,
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.title}>Transfer Created!</Text>
          <Text style={styles.subtitle}>Screen 5/5 - QR Code Ready</Text>
        </View>

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
            <Text style={styles.qrHelper}>Scan to share all patient data</Text>
          </Card>
        )}

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
