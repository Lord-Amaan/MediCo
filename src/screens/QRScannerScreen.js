import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { COLORS, SPACING } from '../constants';
import { Button } from '../components';

const QRScannerScreen = ({ onScanSuccess, onClose }) => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR data (should be JSON string with transfer data)
      const transferData = JSON.parse(data);

      if (!transferData.transferID) {
        throw new Error('Invalid QR code');
      }

      // Call success callback with parsed data
      onScanSuccess?.(transferData);
    } catch (error) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code does not contain valid transfer data.',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Transfer QR</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scanning Frame */}
          <View style={styles.content}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instruction}>Align QR code within frame</Text>
          </View>

          {/* Loading indicator when processing */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing QR code...</Text>
            </View>
          )}
        </View>
      </CameraView>

      {/* Button at bottom */}
      {scanned && !loading && (
        <View style={styles.buttonContainer}>
          <Button
            label="Scan Another"
            onPress={() => {
              setScanned(false);
              setLoading(false);
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
  },
  closeText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: -10,
    left: -10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -10,
    right: -10,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instruction: {
    marginTop: SPACING.lg,
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.white,
    fontSize: 14,
  },
  buttonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
});

export { QRScannerScreen };
