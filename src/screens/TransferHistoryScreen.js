import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const TransferHistoryScreen = ({ patientID, onClose }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransferHistory();
  }, [patientID]);

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);
      if (!patientID) {
        setHistory([]);
        setError('Patient ID missing in scanned data');
        return;
      }

      const response = await api.get(`/transfers/patient/${patientID}`);
      setHistory(response.data.transfers || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Could not load transfer history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#f59e0b';
      case 'In Transit':
        return '#3b82f6';
      case 'Received':
        return '#10b981';
      case 'Acknowledged':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return 'schedule';
      case 'In Transit':
        return 'local-shipping';
      case 'Received':
        return 'check-circle';
      case 'Acknowledged':
        return 'verified';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>📋 Transfer History</Text>
        <Text style={styles.subtitle}>{history.length} transfer{history.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* PATIENT IDENTIFICATION HEADER - Shows how DB distinguishes this patient */}
      {history.length > 0 && history[0]?.patient && (
        <Card style={styles.patientIdentificationCard}>
          <View style={styles.patientIdHeader}>
            <MaterialIcons name="person" size={28} color={COLORS.primary} />
            <View style={styles.patientIdContent}>
              <Text style={styles.patientName}>{history[0].patient.name}</Text>
              <Text style={styles.patientId}>
                🆔 MRN: <Text style={styles.patientIdValue}>{history[0].patient.patientID}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.patientIdDivider} />
          <View style={styles.patientStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Transfers</Text>
              <Text style={styles.statValue}>{history.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Age</Text>
              <Text style={styles.statValue}>{history[0].patient.age}y</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statValue}>{history[0].patient.gender?.[0] || 'N/A'}</Text>
            </View>
          </View>
        </Card>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {history.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No transfer history found</Text>
        </Card>
      ) : (
        <View style={styles.timeline}>
          {history.map((transfer, index) => {
            const status = transfer.transfer?.status || 'Pending';
            const facility = transfer.receivingFacility?.hospitalName || 'Hospital';
            const date = transfer.transfer?.createdAt || transfer.createdAt;
            const diagnosis = transfer.critical?.diagnosis || transfer.patient?.diagnosis || 'Not specified';
            const reason = transfer.critical?.transferReason || 'Not specified';
            const arrivalNote = transfer.acknowledgement?.arrivalNotes || null;
            const discrepancies = transfer.acknowledgement?.discrepancies || [];

            return (
              <View key={transfer._id || index} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <MaterialIcons
                    name={getStatusIcon(status)}
                    size={16}
                    color="#fff"
                    style={[styles.timelineIcon, { color: getStatusColor(status) }]}
                  />
                </View>

                {index < history.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: getStatusColor(status) }]} />
                )}

                <Card style={styles.transferCard}>
                  <View style={styles.transferHeader}>
                    <View>
                      <Text style={styles.facilityName}>{facility}</Text>
                      <Text style={styles.transferDate}>{formatDate(date)}</Text>
                      {transfer.patientTransferSequence && (
                        <Text style={styles.transferSequence}>
                          Transfer #{transfer.patientTransferSequence} for this patient
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.transferDetail}>
                    <Text style={styles.detailLabel}>👤 Patient:</Text>
                    <Text style={styles.detailValue}>{transfer.patient?.name || 'N/A'} (ID: {transfer.patient?.patientID || 'N/A'})</Text>
                  </View>

                  {diagnosis && (
                    <View style={styles.transferDetail}>
                      <Text style={styles.detailLabel}>📋 Diagnosis:</Text>
                      <Text style={styles.detailValue}>{diagnosis}</Text>
                    </View>
                  )}

                  {reason && (
                    <View style={styles.transferDetail}>
                      <Text style={styles.detailLabel}>🚑 Reason:</Text>
                      <Text style={styles.detailValue}>{reason}</Text>
                    </View>
                  )}

                  {arrivalNote && (
                    <View style={styles.transferDetail}>
                      <Text style={styles.detailLabel}>📝 Arrival Note:</Text>
                      <Text style={styles.detailValue}>{arrivalNote}</Text>
                    </View>
                  )}

                  {discrepancies.length > 0 && (
                    <View style={styles.transferDetail}>
                      <Text style={styles.detailLabel}>⚠️ Noted Discrepancies:</Text>
                      {discrepancies.map((disc, i) => (
                        <Text key={i} style={styles.discrepancyText}>
                          • {typeof disc === 'string' ? disc : disc.issue}
                        </Text>
                      ))}
                    </View>
                  )}
                </Card>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textHint,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: 16,
  },
  emptyCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textHint,
    fontSize: 16,
    textAlign: 'center',
  },
  timeline: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  timelineItem: {
    marginBottom: SPACING.lg,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 120,
    backgroundColor: COLORS.primary,
  },
  transferCard: {
    marginLeft: SPACING.xl,
    padding: SPACING.md,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  transferDate: {
    fontSize: 14,
    color: COLORS.textHint,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  transferDetail: {
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.md,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  discrepancyText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  patientIdentificationCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  patientIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  patientIdContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  patientId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHint,
  },
  patientIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  patientIdDivider: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    marginVertical: SPACING.md,
  },
  patientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textHint,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  transferSequence: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});

export default TransferHistoryScreen;
