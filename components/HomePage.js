import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function HomePage({ onStartTransfer, onOpenScanner }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.backgroundCircleLarge} />
        <View style={styles.backgroundCircleSmall} />

        <View style={styles.heroCard}>
          <Text style={styles.title}>MediCo</Text>
          <Text style={styles.subtitle}>
            Smart patient transfer between sending and receiving hospitals.
            {'\n'}
            Capture critical details, generate QR, and hand off care instantly.
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>QR</Text>
              <Text style={styles.metricLabel}>handoff</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>2-step</Text>
              <Text style={styles.metricLabel}>workflow</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={onStartTransfer}>
            <Text style={styles.primaryButtonText}>Start New Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenScanner}>
            <Text style={styles.secondaryButtonText}>Open QR Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Competition Pitch Flow</Text>
          <Text style={styles.infoText}>1. Create patient transfer</Text>
          <Text style={styles.infoText}>2. Generate and share QR instantly</Text>
          <Text style={styles.infoText}>3. Receive, review, and acknowledge</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1f2d',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  backgroundCircleLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#11344a',
    top: -120,
    right: -90,
  },
  backgroundCircleSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1f7a8c',
    opacity: 0.3,
    bottom: -70,
    left: -45,
  },
  heroCard: {
    backgroundColor: '#f4f9ff',
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    color: '#0b1b28',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#355068',
    textAlign: 'center',
  },
  metricsRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f4364',
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#325a74',
  },
  actionSection: {
    marginTop: 22,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#042a2d',
    fontSize: 17,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b2d3de',
  },
  secondaryButtonText: {
    color: '#0f4662',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    marginTop: 20,
    backgroundColor: '#102737',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24475d',
    padding: 16,
  },
  infoTitle: {
    color: '#ebf7ff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoText: {
    color: '#b8d5e6',
    fontSize: 14,
    lineHeight: 22,
  },
});
