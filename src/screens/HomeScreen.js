import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { Card, Button } from '../components';

export const HomeScreen = ({ onNavigate }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Hi doctor!</Text>
        <Text style={styles.subtitle}>Hospital: Rural PHC ✓</Text>
        <Text style={styles.status}>Status: Ready to work</Text>
      </View>

      <View style={styles.menuContainer}>
        <Button
          title="📋 CREATE TRANSFER"
          onPress={() => onNavigate('PatientDetails')}
          variant="primary"
          size="lg"
          style={styles.menuButton}
        />

        <Button
          title="📥 SCAN QR CODE"
          onPress={() => onNavigate('Scanner')}
          variant="secondary"
          size="lg"
          style={styles.menuButton}
        />

        <Button
          title="📊 VIEW HISTORY"
          onPress={() => {}}
          variant="secondary"
          size="lg"
          style={styles.menuButton}
        />
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Recent Transfers</Text>
        <Text style={styles.infoText}>No transfers yet. Start by creating one!</Text>
      </Card>

      <Card style={styles.versionCard}>
        <Text style={styles.versionText}>App Version 1.0</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.primary,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  status: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryLight,
  },
  menuContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  menuButton: {
    marginBottom: SPACING.md,
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  versionCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
