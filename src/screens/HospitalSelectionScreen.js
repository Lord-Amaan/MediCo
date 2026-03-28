import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { Button, Card, FilterTabs, HospitalListItem } from '../components';
import { useTransfer } from '../context/TransferContext';
import { useAuth } from '../context/AuthContext';

// Dummy hospitals data - replace with API call
const DUMMY_HOSPITALS = [
  {
    hospitalID: 'HOSP_PHC_001',
    name: 'Rural PHC',
    type: 'PHC',
    distance: 3,
    departments: ['Emergency', 'General'],
    capabilities: ['basic_care'],
    contact: '0891-1111111',
  },
  {
    hospitalID: 'HOSP_CHC_001',
    name: 'CHC Taluk Center',
    type: 'CHC',
    distance: 15,
    departments: ['Emergency', 'ICU', 'General'],
    capabilities: ['emergency_care'],
    contact: '0891-2222222',
  },
  {
    hospitalID: 'HOSP_DIST_001',
    name: 'District Hospital',
    type: 'District',
    distance: 60,
    departments: ['Emergency', 'ICU', 'Cardiology', 'Trauma'],
    capabilities: ['cardiac_care', 'icu_bed', 'ventilator', 'full_services'],
    contact: '0891-4444444',
  },
  {
    hospitalID: 'HOSP_DIST_002',
    name: 'Medical College District Hospital',
    type: 'District',
    distance: 75,
    departments: ['Emergency', 'ICU', 'Cardiology', 'Neurology', 'Oncology'],
    capabilities: ['cardiac_care', 'neuro_care', 'icu_bed'],
    contact: '0891-5555555',
  },
  {
    hospitalID: 'HOSP_TERTIARY_001',
    name: 'Tertiary Medical Center',
    type: 'Tertiary',
    distance: 200,
    departments: ['All Specialties'],
    capabilities: ['advanced_surgical', 'research', 'trauma_center'],
    contact: '0891-6666666',
  },
];

const HOSPITAL_TYPES = [
  { id: 'PHC', label: 'PHC' },
  { id: 'CHC', label: 'CHC' },
  { id: 'District', label: 'District' },
  { id: 'Tertiary', label: 'Tertiary' },
];

export const HospitalSelectionScreen = ({ onNext, onBack }) => {
  const {
    state,
    setReceivingFacility,
    setHospitalTypeFilter,
  } = useTransfer();
  const { api } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [selectedType, setSelectedType] = useState('District');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch hospitals on mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Filter hospitals when type or search changes
  useEffect(() => {
    filterHospitals(selectedType, searchText);
  }, [selectedType, searchText, hospitals]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching hospitals from API...');
      const response = await api.get('/hospitals');
      console.log('✅ API Response:', response.data);
      
      // Extract hospitals array from response
      let hospitalsData = response.data.hospitals || response.data;
      if (!Array.isArray(hospitalsData)) {
        console.warn('⚠️ API response is not an array:', typeof hospitalsData);
        hospitalsData = DUMMY_HOSPITALS;
      }
      
      console.log('✅ Hospitals fetched:', hospitalsData.length);
      setHospitals(hospitalsData);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch hospitals:', err);
      setError('Failed to fetch hospitals. Using fallback data.');
      // Fallback to dummy data if API fails
      setHospitals(DUMMY_HOSPITALS);
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = (type, search) => {
    // Safety check: ensure hospitals is an array
    if (!Array.isArray(hospitals)) {
      console.warn('⚠️ hospitals is not an array:', hospitals);
      setFilteredHospitals([]);
      return;
    }
    
    let filtered = hospitals.filter((h) => h.type === type);

    if (search.trim()) {
      filtered = filtered.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredHospitals(filtered);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setHospitalTypeFilter(type);
  };

  const handleSelectHospital = (hospital) => {
    setReceivingFacility(hospital);
  };

  const handleNext = () => {
    if (!state.receivingFacility) {
      setError('Please select a hospital');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading hospitals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Receiving Hospital</Text>
        <Text style={styles.subtitle}>Screen 4/6 - Hospital Selection</Text>
      </View>

      {/* Hospital Type Filter */}
      <FilterTabs
        tabs={HOSPITAL_TYPES}
        selectedTab={selectedType}
        onTabChange={handleTypeChange}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospital name..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.textHint}
        />
      </View>

      {/* Hospitals List */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.hospitalID}
        renderItem={({ item }) => (
          <View style={styles.listItemContainer}>
            <HospitalListItem
              hospital={item}
              onSelect={handleSelectHospital}
              isSelected={
                state.receivingFacility?.hospitalID === item.hospitalID
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hospitals found matching your search
            </Text>
          </View>
        }
        style={styles.listContainer}
      />

      {/* Selected Hospital Info */}
      {state.receivingFacility && (
        <Card style={styles.selectedCard} shadow="medium">
          <Text style={styles.selectedLabel}>✓ Selected:</Text>
          <Text style={styles.selectedHospitalName}>
            {state.receivingFacility.name}
          </Text>
          <Text style={styles.selectedInfo}>
            Type: {state.receivingFacility.type}
          </Text>
          <Text style={styles.selectedInfo}>
            Location: {state.receivingFacility.city}, {state.receivingFacility.state}
          </Text>
          {state.receivingFacility.contact && state.receivingFacility.contact.phone && (
            <Text style={styles.selectedInfo}>
              Contact: {state.receivingFacility.contact.phone}
            </Text>
          )}
        </Card>
      )}

      <View style={styles.footer}>
        <Button
          title="← BACK"
          onPress={onBack}
          variant="secondary"
          size="lg"
          style={styles.halfButton}
        />
        <Button
          title="NEXT →"
          onPress={handleNext}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  errorContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  listItemContainer: {
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  selectedCard: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  selectedLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  selectedHospitalName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  selectedInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
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
