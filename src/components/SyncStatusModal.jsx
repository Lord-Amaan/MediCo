import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import useOfflineSync from '../hooks/useOfflineSync';
import useNetworkStatus from '../hooks/useNetworkStatus';

export default function SyncStatusModal({ visible, onClose }) {
  const {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncPendingTransfers,
    getPendingTransfers,
    clearSyncedTransfers,
  } = useOfflineSync();
  const { isOnline } = useNetworkStatus();

  const [pendingTransfers, setPendingTransfers] = useState([]);

  const hasSyncedRecords = useMemo(
    () => pendingTransfers.some((item) => item?.synced),
    [pendingTransfers]
  );

  const loadPending = async () => {
    try {
      const list = await getPendingTransfers();
      setPendingTransfers(Array.isArray(list) ? list : []);
    } catch (error) {
      setPendingTransfers([]);
    }
  };

  useEffect(() => {
    if (visible) {
      loadPending();
    }
  }, [visible]);

  const handleSyncNow = async () => {
    try {
      await syncPendingTransfers();
      await loadPending();
    } catch (error) {
      // sync hook handles internal errors
    }
  };

  const handleClearSynced = async () => {
    try {
      await clearSyncedTransfers();
      await loadPending();
    } catch (error) {
      // clear hook handles internal errors
    }
  };

  const renderItem = ({ item }) => {
    const statusLabel = item?.syncFailed ? 'Failed' : item?.synced ? 'Synced' : 'Pending';
    const statusStyle = item?.syncFailed
      ? styles.failedText
      : item?.synced
      ? styles.syncedText
      : styles.pendingText;

    return (
      <View style={styles.listItem}>
        <Text style={styles.patientName}>{item?.patient?.name || 'Unknown patient'}</Text>
        <Text style={styles.metaText}>Saved: {item?.savedAt ? new Date(item.savedAt).toLocaleString() : 'N/A'}</Text>
        <Text style={[styles.metaText, statusStyle]}>Status: {statusLabel}</Text>
        <Text style={styles.metaText}>Attempts: {item?.syncAttempts || 0}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Sync Status</Text>

          <View style={styles.headerSection}>
            {isSyncing ? (
              <View style={styles.syncingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.syncingText}>Syncing...</Text>
              </View>
            ) : pendingCount > 0 ? (
              <Text style={styles.pendingHeaderText}>{pendingCount} pending</Text>
            ) : (
              <Text style={styles.syncedHeaderText}>All synced ✓</Text>
            )}

            <Text style={styles.lastSyncText}>
              Last synced: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never'}
            </Text>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Pending Transfers</Text>
            <FlatList
              data={pendingTransfers}
              keyExtractor={(item, index) => String(item?.offlineId || item?.transferId || index)}
              renderItem={renderItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No pending transfers</Text>}
            />
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, (!isOnline || isSyncing) && styles.disabledButton]}
              onPress={handleSyncNow}
              disabled={!isOnline || isSyncing}
            >
              <Text style={styles.actionText}>Sync Now</Text>
            </TouchableOpacity>

            {!isOnline && <Text style={styles.tooltipText}>No internet connection</Text>}

            {hasSyncedRecords && (
              <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClearSynced}>
                <Text style={styles.actionText}>Clear Synced Records</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={onClose}>
              <Text style={styles.actionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  headerSection: {
    marginBottom: SPACING.md,
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingText: {
    ...TYPOGRAPHY.body2,
    marginLeft: SPACING.sm,
    color: COLORS.primary,
  },
  pendingHeaderText: {
    ...TYPOGRAPHY.body1,
    color: '#A26A00',
    fontWeight: '600',
  },
  syncedHeaderText: {
    ...TYPOGRAPHY.body1,
    color: '#2E7D32',
    fontWeight: '600',
  },
  lastSyncText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  listSection: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  listItem: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  patientName: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  failedText: {
    color: '#B42318',
  },
  pendingText: {
    color: '#A26A00',
  },
  syncedText: {
    color: '#2E7D32',
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textHint,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  actionsSection: {
    marginTop: SPACING.sm,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  closeButton: {
    backgroundColor: COLORS.gray500,
  },
  actionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  tooltipText: {
    ...TYPOGRAPHY.caption,
    color: '#A26A00',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});
