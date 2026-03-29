import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { Button, Card } from '../components';
import { useTransfer } from '../context/TransferContext';

export const ConfirmationScreen = ({ onNext, onBack }) => {
  const { state } = useTransfer();
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 375;
  const isPhone = width >= 375 && width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLarge = width >= 900;

  const handleNext = () => {
    onNext();
  };

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

      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, isSmallPhone && styles.headerSmall, isTablet && styles.headerTablet]}>
          <Text style={[styles.title, isSmallPhone && styles.titleSmall, isTablet && styles.titleTablet]}>Review & Confirm</Text>
          <Text style={[styles.subtitle, isSmallPhone && styles.subtitleSmall]}>Screen 5/6 - Confirmation</Text>
        </View>

        {/* Sending Hospital */}
        <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
          <Text style={[styles.cardTitle, isSmallPhone && styles.cardTitleSmall]}>SENDING HOSPITAL</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hospital:</Text>
            <Text style={styles.value}>{state.sendingFacility.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>{state.sendingDoctor.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>Now</Text>
          </View>
        </Card>

        {/* Patient Information */}
        <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
          <Text style={[styles.cardTitle, isSmallPhone && styles.cardTitleSmall]}>PATIENT INFORMATION</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{state.patientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{state.patientAge} years</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>MRN:</Text>
            <Text style={styles.value}>{state.patientID}</Text>
          </View>

          {state.patientGender ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.value}>{state.patientGender}</Text>
            </View>
          ) : null}
          {state.patientDateOfBirth ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>DOB:</Text>
              <Text style={styles.value}>{state.patientDateOfBirth}</Text>
            </View>
          ) : null}
          {state.patientPhone ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{state.patientPhone}</Text>
            </View>
          ) : null}
          {state.patientAddress ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{state.patientAddress}</Text>
            </View>
          ) : null}

          {/* Allergies */}
          {state.allergies.length > 0 && (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={[styles.label, styles.warning]}>Allergies:</Text>
              <View>
                {state.allergies.map((allergy, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {allergy}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Medications */}
          {state.medications.length > 0 && (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Medications:</Text>
              <View>
                {state.medications.map((med, index) => (
                  <Text key={index} style={styles.listItem}>
                    • {med}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Transfer Reason */}
          <View style={[styles.detailRow, styles.multilineRow]}>
            <Text style={styles.label}>Reason for Transfer:</Text>
            <Text style={styles.value}>{state.transferReason}</Text>
          </View>

          {state.primaryDiagnosis ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Primary Diagnosis:</Text>
              <Text style={styles.value}>{state.primaryDiagnosis}</Text>
            </View>
          ) : null}

          {(state.vitals?.bloodPressure || state.vitals?.heartRate || state.vitals?.respiratoryRate || state.vitals?.temperature || state.vitals?.oxygenSaturation || state.vitals?.bloodGlucose) ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Vitals:</Text>
              <View>
                {state.vitals.bloodPressure ? <Text style={styles.listItem}>• BP: {state.vitals.bloodPressure}</Text> : null}
                {state.vitals.heartRate ? <Text style={styles.listItem}>• HR: {state.vitals.heartRate}</Text> : null}
                {state.vitals.respiratoryRate ? <Text style={styles.listItem}>• RR: {state.vitals.respiratoryRate}</Text> : null}
                {state.vitals.temperature ? <Text style={styles.listItem}>• Temp: {state.vitals.temperature}</Text> : null}
                {state.vitals.oxygenSaturation ? <Text style={styles.listItem}>• SpO2: {state.vitals.oxygenSaturation}%</Text> : null}
                {state.vitals.bloodGlucose ? <Text style={styles.listItem}>• Glucose: {state.vitals.bloodGlucose}</Text> : null}
              </View>
            </View>
          ) : null}

          {state.pendingInvestigations ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Pending Tests:</Text>
              <Text style={styles.value}>{state.pendingInvestigations}</Text>
            </View>
          ) : null}

          {state.clinicalSummary ? (
            <View style={[styles.detailRow, styles.multilineRow]}>
              <Text style={styles.label}>Clinical Summary:</Text>
              <Text style={styles.value}>{state.clinicalSummary}</Text>
            </View>
          ) : null}

          {state.transferMode ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Transfer Mode:</Text>
              <Text style={styles.value}>{state.transferMode}</Text>
            </View>
          ) : null}
        </Card>

        {/* Receiving Hospital */}
        {state.receivingFacility && (
          <Card style={[styles.card, isSmallPhone && styles.cardSmall, isTablet && styles.cardTablet]}>
            <Text style={[styles.cardTitle, isSmallPhone && styles.cardTitleSmall]}>RECEIVING HOSPITAL</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Hospital:</Text>
              <Text style={styles.value}>{state.receivingFacility.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{state.receivingFacility.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{state.receivingFacility.city}, {state.receivingFacility.state}</Text>
            </View>
            {state.receivingFacility.contact && state.receivingFacility.contact.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{state.receivingFacility.contact.phone}</Text>
              </View>
            )}
            {state.receivingFacility.departments && state.receivingFacility.departments.length > 0 && (
              <View style={[styles.detailRow, styles.multilineRow]}>
                <Text style={styles.label}>Departments:</Text>
                <Text style={styles.value}>
                  {state.receivingFacility.departments.map(d => d.name || d).join(', ')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Confirmation Message */}
        <Card style={[styles.card, styles.confirmationCard, isSmallPhone && styles.cardSmall]} shadow="none">
          <Text style={styles.confirmationText}>
            All details verified. Ready to generate QR code.
          </Text>
        </Card>
      </ScrollView>

      <View style={[styles.footer, isSmallPhone && styles.footerSmall, isTablet && styles.footerTablet]}>
        <Button
          title="← BACK / EDIT"
          onPress={onBack}
          variant="secondary"
          size="md"
          style={styles.halfButton}
          textStyle={styles.backButtonText}
        />
        <Button
          title="GENERATE QR →"
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
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerSmall: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTablet: {
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
  card: {
    marginBottom: SPACING.lg,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E7F4',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  cardSmall: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  cardTablet: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E4A7C',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#C2E1F6',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTitleSmall: {
    fontSize: 12,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  multilineRow: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A7388',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    color: '#0E4A7C',
    flex: 1,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  warning: {
    color: '#D97706',
    fontWeight: '800',
  },
  listItem: {
    fontSize: 12,
    color: '#0E4A7C',
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  confirmationCard: {
    backgroundColor: '#D2EEF4',
    borderLeftWidth: 4,
    borderLeftColor: '#59D9A5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  confirmationText: {
    fontSize: 14,
    color: '#0E4A7C',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
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