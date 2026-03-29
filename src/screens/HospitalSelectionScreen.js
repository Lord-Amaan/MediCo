import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallPhone = width < 375;
  const isPhone = width >= 375 && width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLarge = width >= 900;

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
    <View style={[styles.container, isTablet && styles.containerTablet, isLarge && styles.containerLarge]}>
      {/* Logo Section */}
      <View style={[styles.logoSection, isSmallPhone && styles.logoSectionSmall, isTablet && styles.logoSectionTablet]}>
        <View style={[styles.brandEmblemOuter, isTablet && styles.brandEmblemOuterTablet]}>
          <View style={styles.brandPulseDot} />
          <View style={[styles.brandEmblemInner, isTablet && styles.brandEmblemInnerTablet]}>
            <Text style={[styles.brandEmblemText, isTablet && styles.brandEmblemTextTablet]}>+</Text>
          </View>
        </View>
        <Text style={[styles.brandNameText, isSmallPhone && styles.brandNameTextSmall, isTablet && styles.brandNameTextTablet]}>MediCo</Text>
      </View>

      <View style={[styles.header, isSmallPhone && styles.headerSmall, isTablet && styles.headerTablet]}>
        <Text style={[styles.title, isSmallPhone && styles.titleSmall, isTablet && styles.titleTablet]}>Select Receiving Hospital</Text>
        <Text style={[styles.subtitle, isSmallPhone && styles.subtitleSmall]}>Screen 4/6 - Hospital Selection</Text>
      </View>

      {/* Hospital Type Filter */}
      <FilterTabs
        tabs={HOSPITAL_TYPES}
        selectedTab={selectedType}
        onTabChange={handleTypeChange}
      />

      {/* Search Input */}
      <View style={[styles.searchContainer, isSmallPhone && styles.searchContainerSmall]}>
        <TextInput
          style={[styles.searchInput, isSmallPhone && styles.searchInputSmall, isTablet && styles.searchInputTablet]}
          placeholder="Search hospital name..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.textHint}
        />
      </View>

      {/* Hospitals List */}
      {error && (
        <View style={[styles.errorContainer, isSmallPhone && styles.errorContainerSmall]}>
          <Text style={[styles.errorText, isSmallPhone && styles.errorTextSmall]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.hospitalID}
        renderItem={({ item }) => (
          <View style={[styles.listItemContainer, isSmallPhone && styles.listItemContainerSmall, isTablet && styles.listItemContainerTablet]}>
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
            <Text style={[styles.emptyText, isSmallPhone && styles.emptyTextSmall]}>
              No hospitals found matching your search
            </Text>
          </View>
        }
        style={[styles.listContainer, isSmallPhone && styles.listContainerSmall, isTablet && styles.listContainerTablet]}
      />

      {/* Selected Hospital Info */}
      {state.receivingFacility && (
        <Card style={[styles.selectedCard, isSmallPhone && styles.selectedCardSmall, isTablet && styles.selectedCardTablet]} shadow="medium">
          <Text style={[styles.selectedLabel, isSmallPhone && styles.selectedLabelSmall]}>✓ Selected:</Text>
          <Text style={[styles.selectedHospitalName, isSmallPhone && styles.selectedHospitalNameSmall, isTablet && styles.selectedHospitalNameTablet]}>
            {state.receivingFacility.name}
          </Text>
          <Text style={[styles.selectedInfo, isSmallPhone && styles.selectedInfoSmall]}>
            Type: {state.receivingFacility.type}
          </Text>
          <Text style={[styles.selectedInfo, isSmallPhone && styles.selectedInfoSmall]}>
            Location: {state.receivingFacility.city}, {state.receivingFacility.state}
          </Text>
          {state.receivingFacility.contact && state.receivingFacility.contact.phone && (
            <Text style={[styles.selectedInfo, isSmallPhone && styles.selectedInfoSmall]}>
              Contact: {state.receivingFacility.contact.phone}
            </Text>
          )}
        </Card>
      )}

      <View style={[styles.footer, isSmallPhone && styles.footerSmall, isTablet && styles.footerTablet]}>
        <Button
          title="← BACK"
          onPress={onBack}
          variant="secondary"
          size="md"
          style={styles.halfButton}
          textStyle={styles.backButtonText}
        />
        <Button
          title="NEXT →"
          onPress={handleNext}
          variant="primary"
          size="md"
          style={[styles.halfButton, styles.nextButton]}
          textStyle={styles.nextButtonText}
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
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F7FA',
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerSmall: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTablet: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  titleSmall: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.2,
    marginBottom: SPACING.xs,
  },
  titleTablet: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A7388',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  subtitleSmall: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainerSmall: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#C2E1F6',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: '#0E4A7C',
    backgroundColor: COLORS.white,
    fontWeight: '500',
  },
  searchInputSmall: {
    fontSize: 13,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  searchInputTablet: {
    fontSize: 16,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  errorContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#F44336',
    borderRadius: BORDER_RADIUS.md,
  },
  errorContainerSmall: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorTextSmall: {
    fontSize: 11,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  listContainerSmall: {
    paddingHorizontal: SPACING.md,
  },
  listContainerTablet: {
    paddingHorizontal: SPACING.xl,
  },
  listItemContainer: {
    marginBottom: SPACING.md,
  },
  listItemContainerSmall: {
    marginBottom: SPACING.sm,
  },
  listItemContainerTablet: {
    marginBottom: SPACING.lg,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#5A7388',
    fontWeight: '500',
  },
  emptyTextSmall: {
    fontSize: 12,
  },
  selectedCard: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    backgroundColor: '#D2EEF4',
    borderLeftWidth: 4,
    borderLeftColor: '#59D9A5',
  },
  selectedCardSmall: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  selectedCardTablet: {
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.xl,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedLabelSmall: {
    fontSize: 9,
    marginBottom: SPACING.xs,
  },
  selectedHospitalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E4A7C',
    marginBottom: SPACING.sm,
  },
  selectedHospitalNameSmall: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  selectedHospitalNameTablet: {
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  selectedInfo: {
    fontSize: 12,
    color: '#5A7388',
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  selectedInfoSmall: {
    fontSize: 11,
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: 6,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    backgroundColor: 'rgba(242,247,250,0.94)',
    borderTopWidth: 1,
    borderTopColor: '#DCEAF5',
  },
  footerSmall: {
    paddingHorizontal: SPACING.md,
    paddingTop: 6,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  footerTablet: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 8,
    paddingBottom: SPACING.md,
    gap: SPACING.lg,
  },
  halfButton: {
    flex: 1,
    borderRadius: 12,
  },
  nextButton: {
    backgroundColor: '#0F4C81',
  },
  backButtonText: {
    color: '#1E4B70',
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.35,
  },
});