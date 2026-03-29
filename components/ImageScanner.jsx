import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const MAX_BASE64_CHARS = 5000000;

const ImageScanner = ({ onExtracted, formStep = 'summary' }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedPages, setScannedPages] = useState([]); // Array of {extracted, imageUri, pageNumber}
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(null);

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
    setError(null);
    try {
      const scanReportUrl = `${api?.defaults?.baseURL}/scan-report`;
      const response = await fetch(scanReportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, formStep }),
      });
      const raw = await response.text();
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        data = { error: `Invalid server response (${response.status})` };
      }
      if (!response.ok) throw new Error(data.error || `Scan failed (${response.status})`);
      if (!data?.extracted) throw new Error('No extracted data returned from scan service');
      return data.extracted;
    } catch (err) {
      console.error('Scan report failed:', err?.message || err);
      const msg = String(err?.message || '');
      if (msg.includes('413') || msg.toLowerCase().includes('payload too large')) {
        setError('Image too large, retake.');
      } else if (msg.toLowerCase().includes('network')) {
        setError('Could not reach scan server. Check backend connection and try again.');
      } else {
        setError('Could not read report clearly. Please try again or fill manually.');
      }
      return null;
    }
  };

  const handlePick = useCallback(async (source) => {
    try {
      setError(null);

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
              allowsMultiple: true,
            });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setLoading(true);

      // Process each selected asset sequentially
      const newPages = [];
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const base64Image = asset.base64;

        if (!base64Image) {
          setError(`Could not read image ${i + 1}. Please try again.`);
          setLoading(false);
          return;
        }

        if (base64Image.length > MAX_BASE64_CHARS) {
          setError(`Image ${i + 1} is too large, please retake.`);
          setLoading(false);
          return;
        }

        startPulse();
        console.log(`📸 Scanning image ${i + 1}/${result.assets.length}...`);
        const extracted = await analyzeImage(base64Image);
        stopPulse();

        if (extracted) {
          newPages.push({
            extracted,
            imageUri: asset.uri,
            pageNumber: scannedPages.length + newPages.length + 1,
          });
        } else {
          setError(`Failed to extract data from image ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      // Update state with all new pages at once
      setScannedPages((prev) => {
        const updated = [...prev, ...newPages];
        // Set preview to first newly added page
        setCurrentPreviewIndex(prev.length);
        return updated;
      });

      setLoading(false);
    } catch (e) {
      stopPulse();
      setLoading(false);
      setError('Could not read report clearly. Please try again or fill manually.');
    }
  }, [scannedPages.length, api, formStep]);

  const openPickerOptions = () => {
    Alert.alert('Scan Report', 'Select image source', [
      { text: 'Take Photo', onPress: () => handlePick('camera') },
      { text: 'Choose from Library', onPress: () => handlePick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const mergeExtractedData = () => {
    if (scannedPages.length === 0) return null;

    const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

    const toStringArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') return String(item.name || item.allergy || item.medication || '').trim();
            return '';
          })
          .filter(Boolean);
      }
      if (typeof value === 'string') {
        return value
          .split(/[\n,;|]/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    };

    const toMedicationObjects = (value) => {
      if (!value || !Array.isArray(value)) return [];
      return value
        .map((item) => {
          if (typeof item === 'string') {
            const name = item.trim();
            if (!name) return null;
            return {
              name,
              dose: 'Not specified',
              route: 'Oral',
              frequency: 'As needed',
              mustNotStop: false,
            };
          }
          if (item && typeof item === 'object') {
            const name = String(item.name || item.medication || '').trim();
            if (!name) return null;
            return {
              name,
              dose: String(item.dose || 'Not specified').trim(),
              route: String(item.route || 'Oral').trim(),
              frequency: String(item.frequency || 'As needed').trim(),
              mustNotStop: Boolean(item.mustNotStop),
            };
          }
          return null;
        })
        .filter(Boolean);
    };

    const addUnique = (target, value) => {
      if (!value) return;
      const normalized = String(value).trim();
      if (!normalized) return;
      const exists = target.some((item) => item.toLowerCase() === normalized.toLowerCase());
      if (!exists) {
        target.push(normalized);
      }
    };

    const addMedicationUnique = (target, medication) => {
      if (!medication?.name) return;
      const normalizedName = medication.name.trim().toLowerCase();
      const exists = target.some((item) => item?.name?.trim()?.toLowerCase() === normalizedName);
      if (!exists) {
        target.push(medication);
      }
    };

    const merged = {
      patientName: null,
      patientID: null,
      age: null,
      gender: null,
      dateOfBirth: null,
      phone: null,
      address: null,
      primaryDiagnosis: null,
      transferReason: null,
      pendingInvestigations: null,
      clinicalSummary: null,
      pastMedicalHistory: null,
      surgicalHistory: null,
      transferMode: null,
      allergies: [],
      medications: [],
      activeMedications: [],
      vitals: {},
    };

    // Merge data from all pages
    scannedPages.forEach(({ extracted }) => {
      if (!extracted) return;

      const patientObj = extracted.patient && typeof extracted.patient === 'object' ? extracted.patient : {};
      const criticalObj = extracted.critical && typeof extracted.critical === 'object' ? extracted.critical : {};
      const clinicalObj = extracted.clinical && typeof extracted.clinical === 'object' ? extracted.clinical : {};
      const transferObj = extracted.transfer && typeof extracted.transfer === 'object' ? extracted.transfer : {};

      // Simple string fields - take first non-null value
      if (!merged.patientName) merged.patientName = pickFirst(extracted.patientName, extracted.name, patientObj.name);
      if (!merged.patientID) merged.patientID = pickFirst(extracted.patientID, extracted.id, extracted.mrn, patientObj.patientID, patientObj.id);
      if (!merged.age) merged.age = pickFirst(extracted.age, patientObj.age);
      if (!merged.gender) merged.gender = pickFirst(extracted.gender, patientObj.gender);
      if (!merged.dateOfBirth) merged.dateOfBirth = pickFirst(extracted.dateOfBirth, extracted.dob, patientObj.dateOfBirth);
      if (!merged.phone) merged.phone = pickFirst(extracted.phone, extracted.mobile, patientObj.phone);
      if (!merged.address) merged.address = pickFirst(extracted.address, patientObj.address);
      if (!merged.primaryDiagnosis) merged.primaryDiagnosis = pickFirst(extracted.primaryDiagnosis, criticalObj.primaryDiagnosis);
      if (!merged.transferReason) merged.transferReason = pickFirst(extracted.transferReason, extracted.reason, criticalObj.transferReason, transferObj.reason);
      if (!merged.pendingInvestigations) merged.pendingInvestigations = pickFirst(extracted.pendingInvestigations, clinicalObj.pendingInvestigations, clinicalObj.recentInvestigations);
      if (!merged.clinicalSummary) merged.clinicalSummary = pickFirst(extracted.clinicalSummary, clinicalObj.clinicalSummary);
      if (!merged.pastMedicalHistory) merged.pastMedicalHistory = pickFirst(extracted.pastMedicalHistory, clinicalObj.pastMedicalHistory);
      if (!merged.surgicalHistory) merged.surgicalHistory = pickFirst(extracted.surgicalHistory, clinicalObj.surgicalHistory);
      if (!merged.transferMode) merged.transferMode = pickFirst(extracted.transferMode, transferObj.mode);

      // Arrays - combine and deduplicate
      const allergyList = toStringArray(pickFirst(extracted.allergies, extracted.knownAllergies, criticalObj.allergies));
      allergyList.forEach((allergy) => addUnique(merged.allergies, allergy));

      const medicationObjects = toMedicationObjects(
        pickFirst(extracted.activeMedications, criticalObj.activeMedications)
      );
      medicationObjects.forEach((medication) => {
        addMedicationUnique(merged.activeMedications, medication);
        addUnique(merged.medications, medication.name);
      });

      const medicationNames = toStringArray(
        pickFirst(extracted.medications, extracted.activeMedications, extracted.items, criticalObj.activeMedications)
      );
      medicationNames.forEach((name) => addUnique(merged.medications, name));

      // Vitals object - merge fields
      const vitalsObj = extracted.vitals && typeof extracted.vitals === 'object' ? extracted.vitals : {};
      ['bp', 'bloodPressure', 'pulse', 'heartRate', 'spo2', 'oxygenSaturation', 'temp', 'temperature', 'rr', 'respiratoryRate', 'bloodGlucose', 'glucose']
        .forEach((key) => {
          if (!merged.vitals[key] && vitalsObj[key]) {
            merged.vitals[key] = vitalsObj[key];
          }
        });
    });

    return merged;
  };

  const currentExtracted = currentPreviewIndex !== null ? scannedPages[currentPreviewIndex]?.extracted : null;

  const previewFields = useMemo(() => {
    if (!currentExtracted || typeof currentExtracted !== 'object') return [];

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
      .filter((key) => Object.prototype.hasOwnProperty.call(currentExtracted, key))
      .map((key) => ({ label: key, value: format(currentExtracted[key]) }));
  }, [currentExtracted, formStep]);

  const handleApply = () => {
    const merged = mergeExtractedData();
    if (onExtracted && merged) {
      onExtracted(merged);
    }
    // Reset after applying
    setScannedPages([]);
    setCurrentPreviewIndex(null);
  };

  const handleRemovePage = (index) => {
    setScannedPages((prev) => prev.filter((_, i) => i !== index));
    if (currentPreviewIndex === index) {
      setCurrentPreviewIndex(Math.max(0, index - 1));
    }
  };

  const handleClear = () => {
    setScannedPages([]);
    setCurrentPreviewIndex(null);
    setError(null);
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.scanButton} onPress={openPickerOptions} disabled={loading}>
          <MaterialIcons name="photo-camera" size={18} color="#fff" />
          <Text style={styles.scanButtonText}>
            {scannedPages.length > 0 ? `Continue Scanning (${scannedPages.length} page${scannedPages.length > 1 ? 's' : ''})` : 'Scan Report'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>Analysing page...</Animated.Text>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {scannedPages.length > 0 ? (
          <View style={styles.pagesContainer}>
            <View style={styles.pagesList}>
              <FlatList
                horizontal
                scrollEnabled
                data={scannedPages}
                keyExtractor={(_, i) => `page-${i}`}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.pageThumb,
                      currentPreviewIndex === index && styles.pageThumbActive,
                    ]}
                    onPress={() => setCurrentPreviewIndex(index)}
                  >
                    <Image source={{ uri: item.imageUri }} style={styles.thumbImage} />
                    <Text style={styles.pageNumber}>P {item.pageNumber}</Text>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemovePage(index)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </View>

            {currentPreviewIndex !== null && scannedPages[currentPreviewIndex]?.imageUri ? (
              <Image source={{ uri: scannedPages[currentPreviewIndex].imageUri }} style={styles.previewImage} />
            ) : null}

            <View style={styles.successCard}>
              <Text style={styles.successTitle}>
                📄 Extracted from {scannedPages.length} page{scannedPages.length > 1 ? 's' : ''}
              </Text>
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
                  <Text style={styles.applyButtonText}>Apply All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.discardButton} onPress={handleClear}>
                  <Text style={styles.discardButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    gap: 10,
    padding: 10,
  },
  scanButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E4A7C',
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
  pagesContainer: {
    gap: 12,
  },
  pagesList: {
    maxHeight: 100,
    marginBottom: 8,
  },
  pageThumb: {
    width: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  pageThumbActive: {
    borderColor: '#1d4ed8',
    borderWidth: 3,
  },
  thumbImage: {
    width: '100%',
    height: 60,
    resizeMode: 'cover',
  },
  pageNumber: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
    paddingVertical: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ImageScanner;
