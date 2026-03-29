import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { Card } from '../components';

export const HomeScreen = ({ onNavigate, onOpenScanner }) => {
  const { state, logout } = useAuth();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLarge = width >= 1024;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await logout();
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
    >
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={[styles.brandRow, isTablet && styles.brandRowTablet, isLarge && styles.brandRowLarge]}>
        <View style={[styles.brandEmblemOuter, isTablet && styles.brandEmblemOuterTablet]}>
          <View style={styles.brandPulseDot} />
          <View style={[styles.brandEmblemInner, isTablet && styles.brandEmblemInnerTablet]}>
            <Text style={styles.brandEmblemText}>+</Text>
          </View>
        </View>
        <Text style={[styles.brandNameText, isTablet && styles.brandNameTextTablet]}>MediCo</Text>
      </View>

      <View style={[styles.headerCard, isTablet && styles.headerCardTablet, isLarge && styles.headerCardLarge]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {state.user?.name || 'Doctor'}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.status}>Ready to work</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickMetaRow}>
          <View style={styles.quickMetaItem}>
            <Text style={styles.quickMetaLabel}>Role</Text>
            <Text style={styles.quickMetaValue}>{state.user?.role || 'Doctor'}</Text>
          </View>
          <View style={styles.quickMetaDivider} />
          <View style={styles.quickMetaItem}>
            <Text style={styles.quickMetaLabel}>Facility</Text>
            <Text style={styles.quickMetaValue} numberOfLines={1}>
              {state.user?.hospitalName || 'Rural PHC'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.menuContainer, isTablet && styles.menuContainerTablet, isLarge && styles.menuContainerLarge]}>
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.sectionHeaderAccent} />
          <Text style={styles.sectionHeading}>Quick Access</Text>
          <View style={styles.sectionHeaderAccent} />
        </View>
        <Text style={styles.sectionSubheading}>Start transfer, scan QR, or view handoff history</Text>

        <TouchableOpacity onPress={() => onNavigate('PatientDetails')} style={styles.primaryMenuButton}>
          <View style={styles.menuButtonContent}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={COLORS.white} />
            <Text style={styles.primaryMenuButtonText}>CREATE TRANSFER</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenScanner} style={styles.secondaryMenuButton}>
          <View style={styles.menuButtonContent}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={COLORS.white} />
            <Text style={styles.secondaryMenuButtonText}>SCAN QR CODE</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onNavigate('TransferHistory')} style={styles.tertiaryMenuButton}>
          <View style={styles.menuButtonContent}>
            <MaterialCommunityIcons name="history" size={20} color="#1E4B70" />
            <Text style={styles.tertiaryMenuButtonText}>VIEW HISTORY</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Card style={[styles.infoCard, isTablet && styles.infoCardTablet]} padding={10}>
        <View style={styles.infoTopRow}>
          <View style={styles.infoIconBadge}>
            <MaterialCommunityIcons name="stethoscope" size={18} color="#0F4C81" />
          </View>
        </View>
        <Text style={styles.infoTitle}>Smart Transfer Workflow</Text>
        <Text style={styles.infoText}>
          Start transfers in seconds, scan incoming referrals, and maintain a clear handoff trail.
        </Text>
        <View style={styles.infoHighlightsRow}>
          <View style={styles.infoHighlightChip}>
            <Text style={styles.infoHighlightText}>Workflow</Text>
          </View>
          <View style={styles.infoHighlightChip}>
            <Text style={styles.infoHighlightText}>Fast Start</Text>
          </View>
          <View style={styles.infoHighlightChip}>
            <Text style={styles.infoHighlightText}>QR Intake</Text>
          </View>
          <View style={styles.infoHighlightChip}>
            <Text style={styles.infoHighlightText}>Clear Handoff</Text>
          </View>
        </View>
      </Card>

      <Card style={[styles.versionCard, isTablet && styles.versionCardTablet]} padding={8}>
        <Text style={styles.versionText}>MediCo v1.0.0</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FA',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.xl,
  },
  contentTablet: {
    alignItems: 'center',
    paddingTop: 68,
  },
  bgOrbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D2EEF4',
    top: -90,
    right: -70,
    opacity: 0.8,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFE0CC',
    bottom: -120,
    left: -110,
    opacity: 0.7,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
    gap: SPACING.md,
  },
  brandRowTablet: {
    width: '92%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  brandRowLarge: {
    maxWidth: 860,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brandEmblemText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 15,
  },
  brandNameText: {
    color: '#0E4A7C',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  brandNameTextTablet: {
    fontSize: 27,
  },
  headerCard: {
    borderRadius: 22,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: '#0E4A7C',
    borderWidth: 1,
    borderColor: '#C2E1F6',
    shadowColor: '#0B2239',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: SPACING.lg,
  },
  headerCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  headerCardLarge: {
    maxWidth: 860,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  subtitle: {
    fontSize: 24,
    color: '#F6FBFF',
    marginBottom: 6,
    fontWeight: '900',
    letterSpacing: 0.15,
    lineHeight: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#61D2A5',
    marginRight: 8,
  },
  status: {
    ...TYPOGRAPHY.body2,
    color: '#CBE6FA',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  quickMetaRow: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
    paddingTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickMetaItem: {
    flex: 1,
  },
  quickMetaDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: SPACING.md,
  },
  quickMetaLabel: {
    color: '#9FCCEE',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '700',
  },
  quickMetaValue: {
    color: '#F3FAFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuContainer: {
    marginBottom: SPACING.md,
    paddingHorizontal: 10,
  },
  menuContainerTablet: {
    width: '92%',
    maxWidth: 760,
  },
  menuContainerLarge: {
    maxWidth: 860,
  },
  sectionHeading: {
    fontSize: 17,
    color: '#123A59',
    fontWeight: '900',
    letterSpacing: 0.15,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: SPACING.sm,
  },
  sectionHeaderAccent: {
    height: 2,
    width: 24,
    borderRadius: 1,
    backgroundColor: '#9EC9E8',
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#5A7388',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  primaryMenuButton: {
    marginBottom: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#0F4C81',
    shadowColor: '#0F4C81',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryMenuButtonText: {
    fontWeight: '800',
    letterSpacing: 0.3,
    color: COLORS.white,
  },
  secondaryMenuButton: {
    marginBottom: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#2A7FBC',
    shadowColor: '#2A7FBC',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  secondaryMenuButtonText: {
    fontWeight: '800',
    letterSpacing: 0.3,
    color: COLORS.white,
  },
  tertiaryMenuButton: {
    marginBottom: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#EAF3FA',
    borderWidth: 1,
    borderColor: '#CFE2F1',
  },
  tertiaryMenuButtonText: {
    color: '#1E4B70',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.sm,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#CCE1F1',
    shadowColor: '#0B2239',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  infoCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#113955',
    marginBottom: 8,
    letterSpacing: 0.2,
    lineHeight: 25,
    textAlign: 'left',
  },
  infoText: {
    fontSize: 13,
    color: '#4A6880',
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'left',
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  infoIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F2FA',
    borderWidth: 1,
    borderColor: '#C5DDF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  infoHighlightChip: {
    backgroundColor: '#EDF6FD',
    borderWidth: 1,
    borderColor: '#CDE1F1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoHighlightText: {
    fontSize: 10,
    color: '#214D70',
    fontWeight: '800',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  versionCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#D9E7F2',
    marginBottom: SPACING.lg,
    borderRadius: 12,
  },
  versionCardTablet: {
    width: '92%',
    maxWidth: 760,
  },
  versionText: {
    fontSize: 11,
    color: '#5D7285',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
});
