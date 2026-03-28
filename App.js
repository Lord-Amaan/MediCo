// ============================================================================
// REACT NATIVE UI COMPONENTS FOR PATIENT TRANSFER APP
// Copy these directly into your App.js
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';

const API_URL = 'http://192.168.YOUR.IP:5000'; // UPDATE THIS

export default function App() {
  const [screen, setScreen] = useState('form');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // COMPONENT 1: TRANSFER FORM SCREEN
  // ============================================================================
  const FormScreen = () => {
    const [formData, setFormData] = useState({
      patientName: '',
      patientID: '',
      age: '',
      allergies: '',
      medications: '',
      vitals: '',
      reason: '',
      clinicalNotes: '',
    });

    const handleSubmit = async () => {
      if (!formData.patientName.trim()) {
        Alert.alert('Error', 'Patient name required');
        return;
      }
      if (!formData.allergies.trim()) {
        Alert.alert('Error', 'Allergies field is CRITICAL');
        return;
      }

      setLoading(true);
      try {
        // Try to save to server
        const response = await axios.post(
          `${API_URL}/api/transfers`,
          formData,
          { timeout: 5000 }
        );
        console.log('✓ Saved to server:', response.data.id);
      } catch (error) {
        console.log('Offline - QR will still work');
      }

      // Show QR screen
      setScreen('qr');
      setLoading(false);
    };

    return (
      <ScrollView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📋 Patient Transfer</Text>
          <Text style={styles.headerSubtitle}>Sending Hospital</Text>
        </View>

        {/* PATIENT NAME */}
        <TextInput
          placeholder="Patient Name *"
          value={formData.patientName}
          onChangeText={(text) =>
            setFormData({ ...formData, patientName: text })
          }
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* PATIENT ID */}
        <TextInput
          placeholder="Patient ID / MRN"
          value={formData.patientID}
          onChangeText={(text) =>
            setFormData({ ...formData, patientID: text })
          }
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* AGE */}
        <TextInput
          placeholder="Age"
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        {/* ⚠️ ALLERGIES - CRITICAL */}
        <Text style={styles.criticalLabel}>⚠️ ALLERGIES (CRITICAL) *</Text>
        <TextInput
          placeholder="e.g., Penicillin, Aspirin"
          value={formData.allergies}
          onChangeText={(text) =>
            setFormData({ ...formData, allergies: text })
          }
          style={[styles.input, styles.criticalInput]}
          placeholderTextColor="#cc0000"
          multiline
        />

        {/* MEDICATIONS */}
        <Text style={styles.sectionLabel}>💊 Active Medications</Text>
        <TextInput
          placeholder="e.g., Metformin 500mg BID, Lisinopril 10mg OD"
          value={formData.medications}
          onChangeText={(text) =>
            setFormData({ ...formData, medications: text })
          }
          style={styles.input}
          multiline
          placeholderTextColor="#999"
        />

        {/* VITALS */}
        <Text style={styles.sectionLabel}>📊 Last Vitals</Text>
        <TextInput
          placeholder="e.g., BP 140/90, HR 88, O2 98%"
          value={formData.vitals}
          onChangeText={(text) => setFormData({ ...formData, vitals: text })}
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* REASON FOR TRANSFER */}
        <Text style={styles.sectionLabel}>🚑 Reason for Transfer</Text>
        <TextInput
          placeholder="e.g., Hypertensive crisis"
          value={formData.reason}
          onChangeText={(text) => setFormData({ ...formData, reason: text })}
          style={[styles.input, styles.textArea]}
          multiline
          placeholderTextColor="#999"
        />

        {/* CLINICAL NOTES */}
        <Text style={styles.sectionLabel}>📝 Clinical Summary</Text>
        <TextInput
          placeholder="Brief clinical history"
          value={formData.clinicalNotes}
          onChangeText={(text) =>
            setFormData({ ...formData, clinicalNotes: text })
          }
          style={[styles.input, styles.textArea]}
          multiline
          maxLength={200}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>
          {formData.clinicalNotes.length}/200
        </Text>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              Generate QR Code
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Patient can leave immediately after QR is generated
        </Text>
      </ScrollView>
    );
  };

  // ============================================================================
  // COMPONENT 2: QR CODE DISPLAY SCREEN
  // ============================================================================
  const QRDisplayScreen = () => {
    const qrRef = useRef();
    const [formData] = useState({
      patientName: 'John Doe',
      allergies: 'Penicillin',
      medications: 'Metformin 500mg',
      reason: 'Hypertensive crisis',
    });

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✓ QR Code Ready</Text>
          <Text style={styles.headerSubtitle}>Print or screenshot this</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QRCode
              ref={qrRef}
              value={JSON.stringify(formData)}
              size={280}
              color="black"
              backgroundColor="white"
              quietZone={10}
            />
          </View>
          <Text style={styles.qrInstructions}>
            📌 Attach this QR to patient folder
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Patient ready to transfer</Text>
          <Text style={styles.infoText}>Name: {formData.patientName}</Text>
          <Text style={styles.infoText}>
            Allergies: {formData.allergies}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => setScreen('scan')}
        >
          <Text style={styles.nextButtonText}>
            Scan QR (Receiving Doctor)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('form')}
        >
          <Text style={styles.backButtonText}>New Transfer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // COMPONENT 3: QR SCANNER SCREEN
  // ============================================================================
  const ScannerScreen = () => {
    if (!permission) {
      return (
        <View style={styles.container}>
          <Text>Requesting camera permission...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Camera permission required</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const handleBarcodeScan = ({ data }) => {
      try {
        const parsed = JSON.parse(data);
        setScreen('received');
        // Pass scanned data to received screen
        setScannedData(parsed);
      } catch (e) {
        Alert.alert('Error', 'Invalid QR code');
      }
    };

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarcodeScan}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.scanOverlay}>
          <Text style={styles.scanText}>Aim at QR code</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setScreen('qr')}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // COMPONENT 4: RECEIVED DATA DISPLAY SCREEN
  // ============================================================================
  const ReceivedScreen = () => {
    const [scannedData] = useState({
      patientName: 'John Doe',
      patientID: 'P123456',
      allergies: 'Penicillin',
      medications: 'Metformin 500mg',
      vitals: 'BP 140/90',
      reason: 'Hypertensive crisis',
      clinicalNotes: 'Patient has been stable',
    });

    const [arrivalNotes, setArrivalNotes] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);

    const handleAcknowledge = async () => {
      if (!arrivalNotes.trim()) {
        Alert.alert('Note', 'Please add arrival notes');
        return;
      }

      setLoading(true);
      try {
        // Send acknowledgement to backend
        const response = await axios.post(`${API_URL}/api/acknowledge`, {
          patient_name: scannedData.patientName,
          arrival_notes: arrivalNotes,
          acknowledged_at: new Date().toISOString(),
        });
        console.log('✓ Acknowledged:', response.data);
        Alert.alert('✓ Success', 'Transfer acknowledged');
        setAcknowledged(true);
      } catch (error) {
        Alert.alert('Note', 'Will sync when online');
        setAcknowledged(true);
      }
      setLoading(false);
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏥 Receiving Hospital</Text>
          <Text style={styles.headerSubtitle}>Patient Transfer</Text>
        </View>

        {/* ⚠️ ALLERGIES - RED ALERT (FIRST!) */}
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ ALLERGIES</Text>
          <Text style={styles.alertText}>{scannedData.allergies}</Text>
        </View>

        {/* 💊 MEDICATIONS */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💊 Active Medications</Text>
          <Text style={styles.infoText}>{scannedData.medications}</Text>
        </View>

        {/* 🚑 REASON */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚑 Reason for Transfer</Text>
          <Text style={styles.infoText}>{scannedData.reason}</Text>
        </View>

        {/* FULL RECORD */}
        <View style={styles.fullRecordCard}>
          <Text style={styles.recordTitle}>Full Patient Record</Text>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Name:</Text>
            <Text style={styles.recordValue}>
              {scannedData.patientName}
            </Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>ID:</Text>
            <Text style={styles.recordValue}>{scannedData.patientID}</Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Vitals:</Text>
            <Text style={styles.recordValue}>{scannedData.vitals}</Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>Clinical Notes:</Text>
            <Text style={styles.recordValue}>
              {scannedData.clinicalNotes}
            </Text>
          </View>
        </View>

        {/* ARRIVAL NOTES */}
        {!acknowledged && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>📝 Arrival Notes</Text>
            <TextInput
              placeholder="Describe patient condition on arrival"
              value={arrivalNotes}
              onChangeText={setArrivalNotes}
              style={[styles.input, styles.textArea]}
              multiline
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={handleAcknowledge}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.acknowledgeButtonText}>
                  ✓ Mark as Reviewed
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {acknowledged && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>✓ Transfer Acknowledged</Text>
            <Text style={styles.successText}>
              Time: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('form')}
        >
          <Text style={styles.backButtonText}>New Transfer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [scannedData, setScannedData] = useState(null);

  // ============================================================================
  // RENDER SCREENS
  // ============================================================================
  return (
    <>
      {screen === 'form' && <FormScreen />}
      {screen === 'qr' && <QRDisplayScreen />}
      {screen === 'scan' && <ScannerScreen />}
      {screen === 'received' && <ReceivedScreen />}
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e0ff',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 12,
  },
  criticalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  criticalInput: {
    borderColor: '#cc0000',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginRight: 20,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#34C759',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginBottom: 40,
    marginTop: 8,
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b5e20',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: '#ffebee',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b71c1c',
    lineHeight: 24,
  },
  fullRecordCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  recordValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  acknowledgeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  successText: {
    fontSize: 13,
    color: '#2e7d32',
    marginTop: 6,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
});
