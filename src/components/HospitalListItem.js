import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../constants';

export const HospitalListItem = ({
  hospital,
  onSelect,
  isSelected = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        SHADOWS.small,
      ]}
      onPress={() => onSelect(hospital)}
    >
      <View style={styles.radioContainer}>
        <View style={styles.radio}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.hospitalName}>{hospital.name}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            📍 {hospital.distance} km
          </Text>
          <Text style={styles.detailText}>
            📞 {hospital.contact}
          </Text>
        </View>

        {hospital.departments && hospital.departments.length > 0 && (
          <View style={styles.departmentsContainer}>
            <Text style={styles.departmentsLabel}>Departments:</Text>
            <Text style={styles.departmentsList}>
              {hospital.departments.join(', ')}
            </Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Selected</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioContainer: {
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  hospitalName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  detailsContainer: {
    marginBottom: SPACING.sm,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  departmentsContainer: {
    marginBottom: SPACING.sm,
  },
  departmentsLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  departmentsList: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  selectedBadge: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
});
