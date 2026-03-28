import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { Card, Button } from '../components';

export const HomeScreen = ({ onNavigate, onOpenScanner }) => {
  const { state, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>👋 Welcome!</Text>
            <Text style={styles.subtitle}>
              {state.user?.name || 'Doctor'}
            </Text>
            <Text style={styles.status}>Status: Ready to work</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Button
          label="📋 CREATE TRANSFER"
          onPress={() => onNavigate('PatientDetails')}
          style={styles.menuButton}
        />

        <Button
          label="📥 SCAN QR CODE"
          onPress={onOpenScanner}
          style={styles.menuButton}
        />

        <Button
          label="📊 VIEW HISTORY"
          onPress={() => {}}
          variant="secondary"
          style={styles.menuButton}
        />
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Recent Transfers</Text>
        <Text style={styles.infoText}>No transfers yet. Start by creating one!</Text>
      </Card>

      <Card style={styles.versionCard}>
        <Text style={styles.versionText}>App Version 1.0 • MediCo</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
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
