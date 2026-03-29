import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

export default function DrugInteractionAlert({
  visible,
  conflicts,
  hasCritical,
  onGoBack,
  onContinue,
  aiUsed,
}) {
  const criticalConflicts = (conflicts || []).filter((item) => item.risk === 'Critical');
  const warningConflicts = (conflicts || []).filter((item) => item.risk === 'Warning');

  const renderInvolvedText = (conflict) => {
    if (conflict.involved) return conflict.involved;
    if (conflict.type === 'Drug-Drug') return `${conflict.drug1} + ${conflict.drug2}`;
    return `${conflict.drug1} + ${conflict.allergy} allergy`;
  };

  const totalConflicts = (conflicts || []).length;

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.warningIcon}>!</Text>
              <View>
                <Text style={[styles.titleText, hasCritical ? styles.titleCritical : styles.titleWarning]}>
                {hasCritical ? 'Critical Conflicts Found' : 'Warnings Found'}
              </Text>
                <Text style={styles.subtitleText}>Review medication and allergy risks before transfer</Text>
              </View>
            </View>
            {aiUsed ? (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Total</Text>
              <Text style={styles.metricValue}>{totalConflicts}</Text>
            </View>
            <View style={[styles.metricPill, styles.metricCritical]}>
              <Text style={styles.metricLabel}>Critical</Text>
              <Text style={styles.metricValue}>{criticalConflicts.length}</Text>
            </View>
            <View style={[styles.metricPill, styles.metricWarning]}>
              <Text style={styles.metricLabel}>Warnings</Text>
              <Text style={styles.metricValue}>{warningConflicts.length}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {criticalConflicts.map((conflict, index) => (
              <View
                key={`critical-${index}`}
                style={[styles.conflictCard, styles.criticalCard]}
              >
                <View style={styles.conflictHeaderRow}>
                  <Text style={[styles.riskBadge, styles.riskBadgeCritical]}>CRITICAL</Text>
                  <Text style={styles.conflictTypeText}>
                    {conflict.type === 'Drug-Drug' ? 'Drug-Drug Interaction' : 'Allergy Conflict'}
                  </Text>
                </View>
                <Text style={styles.conflictLine}>
                  Involved: <Text style={styles.conflictLineValue}>{renderInvolvedText(conflict)}</Text>
                </Text>
                <Text style={styles.conflictLine}>
                  Reason: <Text style={styles.conflictLineValue}>{conflict.reason}</Text>
                </Text>
                {conflict.recommendation ? (
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationLabel}>Recommendation</Text>
                    <Text style={styles.recommendationText}>{conflict.recommendation}</Text>
                  </View>
                ) : null}
              </View>
            ))}

            {warningConflicts.map((conflict, index) => (
              <View
                key={`warning-${index}`}
                style={[styles.conflictCard, styles.warningCard]}
              >
                <View style={styles.conflictHeaderRow}>
                  <Text style={[styles.riskBadge, styles.riskBadgeWarning]}>WARNING</Text>
                  <Text style={styles.conflictTypeText}>
                  {conflict.type === 'Drug-Drug' ? 'Drug-Drug Interaction' : 'Allergy Conflict'}
                </Text>
                </View>
                <Text style={styles.conflictLine}>
                  Involved: <Text style={styles.conflictLineValue}>{renderInvolvedText(conflict)}</Text>
                </Text>
                <Text style={styles.conflictLine}>
                  Reason: <Text style={styles.conflictLineValue}>{conflict.reason}</Text>
                </Text>
                {conflict.recommendation ? (
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationLabel}>Recommendation</Text>
                    <Text style={styles.recommendationText}>{conflict.recommendation}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={onGoBack}
          >
            <Text style={styles.primaryActionText}>Go Back and Edit Medications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionButton, hasCritical ? styles.secondaryCritical : styles.secondaryWarning]}
            onPress={onContinue}
          >
            <Text style={[styles.secondaryActionText, hasCritical ? styles.secondaryCriticalText : styles.secondaryWarningText]}>
              {hasCritical ? 'Override and Continue (Not Recommended)' : 'I Acknowledge — Continue Transfer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 20, 32, 0.58)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#F8FCFF',
    borderWidth: 1,
    borderColor: '#CFE2F1',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  handle: {
    width: 52,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#BFD3E3',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  warningIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    backgroundColor: '#D64545',
    fontSize: 15,
    fontWeight: '900',
    overflow: 'hidden',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  titleCritical: {
    color: '#A61B1B',
  },
  titleWarning: {
    color: '#9A610F',
  },
  subtitleText: {
    marginTop: 3,
    fontSize: 12,
    color: '#5F7385',
  },
  aiBadge: {
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#A8E4C5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiBadgeText: {
    color: '#157347',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  metricsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3E3EE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    alignItems: 'center',
  },
  metricCritical: {
    borderColor: '#F1C4C4',
    backgroundColor: '#FFF6F6',
  },
  metricWarning: {
    borderColor: '#F1DFB8',
    backgroundColor: '#FFF9EE',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F7385',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: '#12324A',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9E7F2',
    marginVertical: 12,
  },
  scrollArea: {
    maxHeight: 340,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  conflictCard: {
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  criticalCard: {
    backgroundColor: '#FFF2F2',
    borderColor: '#E8AAAA',
  },
  warningCard: {
    backgroundColor: '#FFF8E9',
    borderColor: '#E6C98C',
  },
  conflictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  riskBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  riskBadgeCritical: {
    backgroundColor: '#D64545',
    color: '#FFFFFF',
  },
  riskBadgeWarning: {
    backgroundColor: '#A4660D',
    color: '#FFFFFF',
  },
  conflictTypeText: {
    fontSize: 12,
    color: '#1B3B55',
    fontWeight: '800',
  },
  conflictLine: {
    fontSize: 12,
    color: '#355169',
    lineHeight: 17,
    marginBottom: 4,
    fontWeight: '600',
  },
  conflictLineValue: {
    color: '#132B3D',
    fontWeight: '700',
  },
  recommendationBox: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7E6F2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recommendationLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    fontWeight: '800',
    color: '#365975',
    marginBottom: 2,
  },
  recommendationText: {
    fontSize: 12,
    color: '#1F3D55',
    lineHeight: 17,
    fontWeight: '600',
  },
  primaryActionButton: {
    marginTop: 12,
    backgroundColor: '#CC3535',
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#B22A2A',
  },
  primaryActionText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  secondaryActionButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
  },
  secondaryCritical: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CD4A4A',
  },
  secondaryWarning: {
    backgroundColor: '#EAF2F8',
    borderColor: '#C8DAE8',
  },
  secondaryActionText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryCriticalText: {
    color: '#B22A2A',
  },
  secondaryWarningText: {
    color: '#274A63',
  },
});
