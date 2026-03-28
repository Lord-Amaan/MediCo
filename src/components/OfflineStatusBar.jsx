import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import useNetworkStatus from '../hooks/useNetworkStatus';
import useOfflineSync from '../hooks/useOfflineSync';

export default function OfflineStatusBar({ onSyncPress, isOnline: isOnlineProp, pendingCount: pendingCountProp, isSyncing: isSyncingProp }) {
  const { isOnline: onlineFromHook } = useNetworkStatus();
  const { pendingCount: pendingFromHook, isSyncing: syncingFromHook } = useOfflineSync();

  const isOnline = typeof isOnlineProp === 'boolean' ? isOnlineProp : onlineFromHook;
  const pendingCount = typeof pendingCountProp === 'number' ? pendingCountProp : pendingFromHook;
  const isSyncing = typeof isSyncingProp === 'boolean' ? isSyncingProp : syncingFromHook;

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer]}>
        <Text style={[styles.text, styles.offlineText]}>⊘ You are offline — form data will be saved locally</Text>
        <Text style={[styles.subText, styles.offlineSubText]}>Offline QR will be generated</Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncingContainer, styles.syncRow]}>
        <ActivityIndicator size="small" color="#2E7D32" />
        <Text style={[styles.text, styles.syncingText]}>Syncing transfers to server...</Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.container, styles.pendingContainer]}
        onPress={onSyncPress}
      >
        <Text style={[styles.text, styles.pendingText]}>{pendingCount} transfer(s) pending sync</Text>
        <Text style={[styles.subText, styles.pendingSubText]}>Tap to sync now</Text>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.body2,
    textAlign: 'center',
    fontWeight: '600',
  },
  subText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  offlineContainer: {
    backgroundColor: '#FAEEDA',
  },
  offlineText: {
    color: '#8A5A00',
  },
  offlineSubText: {
    color: '#A26A00',
  },
  pendingContainer: {
    backgroundColor: '#E6F1FB',
  },
  pendingText: {
    color: '#0C4A7A',
  },
  pendingSubText: {
    color: '#1E6091',
  },
  syncingContainer: {
    backgroundColor: '#EAF3DE',
  },
  syncingText: {
    color: '#2E7D32',
    marginLeft: SPACING.sm,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
