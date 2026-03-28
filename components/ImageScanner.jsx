import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const MAX_BASE64_CHARS = 5000000;

const ImageScanner = ({ onExtracted, formStep = 'summary' }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const analyzeImage = async (base64Image) => {
    setLoading(true)
    setError(null)
    try {
      const scanReportUrl = `${api?.defaults?.baseURL}/scan-report`;
      const response = await fetch(
        scanReportUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, formStep }),
        }
      )
      const raw = await response.text()
      let data = {}
      try {
        data = JSON.parse(raw)
      } catch (parseError) {
        data = { error: `Invalid server response (${response.status})` }
      }
      if (!response.ok) throw new Error(data.error || `Scan failed (${response.status})`)
      if (!data?.extracted) throw new Error('No extracted data returned from scan service')
      setExtracted(data.extracted)
    } catch (err) {
      console.error('Scan report failed:', err?.message || err)
      const msg = String(err?.message || '')
      if (msg.includes('413') || msg.toLowerCase().includes('payload too large')) {
        setError('Image too large, retake.')
      } else if (msg.toLowerCase().includes('network')) {
        setError('Could not reach scan server. Check backend connection and try again.')
      } else {
        setError('Could not read report clearly. Please try again or fill manually.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePick = async (source) => {
    try {
      setError(null);
      setExtracted(null);

      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          setError('Camera permission is required to scan report.');
          return;
        }
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          setError('Media library permission is required to scan report.');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              quality: 0.8,
              base64: true,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              quality: 0.8,
              base64: true,
              allowsEditing: false,
            });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const selected = result.assets[0];
      const base64Image = selected.base64;

      if (!base64Image) {
        setError('Could not read report clearly. Please try again or fill manually.');
        return;
      }

      if (base64Image.length > MAX_BASE64_CHARS) {
        setError('Image too large, retake.');
        return;
      }

      setImageUri(selected.uri);
      startPulse();
      await analyzeImage(base64Image);
      stopPulse();
    } catch (e) {
      stopPulse();
      setError('Could not read report clearly. Please try again or fill manually.');
    }
  };

  const openPickerOptions = () => {
    Alert.alert('Scan Report', 'Select image source', [
      { text: 'Take Photo', onPress: () => handlePick('camera') },
      { text: 'Choose from Library', onPress: () => handlePick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const previewFields = useMemo(() => {
    if (!extracted || typeof extracted !== 'object') return [];

    const format = (value) => {
      if (value === null || value === undefined) return 'null';
      if (Array.isArray(value)) return value.length ? value.join(', ') : '[]';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    const keysByStep = {
      medications: ['name', 'dose', 'route', 'frequency', 'mustNotStop'],
      vitals: ['bp', 'pulse', 'spo2', 'temp', 'rr'],
      allergies: ['allergies'],
      summary: ['primaryDiagnosis', 'transferReason', 'pendingInvestigations', 'clinicalSummary'],
    };

    const selectedKeys = keysByStep[formStep] || [
      'patientName',
      'age',
      'gender',
      'name',
      'dose',
      'route',
      'frequency',
      'mustNotStop',
      'bp',
      'pulse',
      'spo2',
      'temp',
      'rr',
      'allergies',
      'primaryDiagnosis',
      'transferReason',
      'pendingInvestigations',
      'clinicalSummary',
    ];

    return selectedKeys
      .filter((key) => Object.prototype.hasOwnProperty.call(extracted, key))
      .map((key) => ({ label: key, value: format(extracted[key]) }));
  }, [extracted, formStep]);

  const handleApply = () => {
    if (onExtracted && extracted) {
      onExtracted(extracted);
    }
    setExtracted(null);
    setImageUri(null);
  };

  const handleDiscard = () => {
    setExtracted(null);
    setImageUri(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.scanButton} onPress={openPickerOptions} disabled={loading}>
        <MaterialIcons name="photo-camera" size={18} color="#fff" />
        <Text style={styles.scanButtonText}>Scan Report</Text>
      </TouchableOpacity>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}

      {loading ? (
        <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>Analysing report...</Animated.Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {extracted ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Extracted Key Fields</Text>
          {previewFields.length > 0 ? (
            previewFields.map((item) => (
              <View style={styles.fieldRow} key={item.label}>
                <Text style={styles.fieldLabel}>{item.label}:</Text>
                <Text style={styles.fieldValue}>{item.value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.fieldValue}>No key fields found.</Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply to Form</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  scanButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#e5e7eb',
  },
  loadingText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  successTitle: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '800',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldLabel: {
    color: '#065f46',
    fontWeight: '700',
  },
  fieldValue: {
    color: '#064e3b',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
});

export default ImageScanner;
