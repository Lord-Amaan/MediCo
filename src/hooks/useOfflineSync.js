import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useNetworkStatus from './useNetworkStatus';
import { useAuth } from '../context/AuthContext';

const PENDING_TRANSFERS_KEY = 'medico_pending_transfers';
const SYNC_STATUS_KEY = 'medico_sync_status';

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export default function useOfflineSync() {
  const { isOnline } = useNetworkStatus();
  const { api } = useAuth();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const isSyncingRef = useRef(false);
  const prevOnlineRef = useRef(isOnline);

  const getPendingTransfers = useCallback(async () => {
    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const pending = existing ? JSON.parse(existing) : [];
      if (!Array.isArray(pending)) return [];
      return pending.filter((item) => item?.synced === false);
    } catch (error) {
      console.log('getPendingTransfers error:', error);
      return [];
    }
  }, []);

  const savePendingTransfer = useCallback(async (record) => {
    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const pending = existing ? JSON.parse(existing) : [];
      const safePending = Array.isArray(pending) ? pending : [];

      safePending.push({
        ...record,
        savedAt: new Date().toISOString(),
        synced: false,
        syncAttempts: 0,
      });

      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(safePending));
      setPendingCount(safePending.filter((item) => item?.synced === false).length);
      console.log(`[OfflineSync] Saved pending transfer: ${record?.offlineId || 'unknown-id'} | pending=${safePending.filter((item) => item?.synced === false).length}`);
      return record?.offlineId;
    } catch (error) {
      console.log('savePendingTransfer error:', error);
      return record?.offlineId;
    }
  }, []);

  const syncPendingTransfers = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (!isOnline) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const allRecords = existing ? JSON.parse(existing) : [];
      const records = Array.isArray(allRecords) ? allRecords : [];
      const unsynced = records.filter((item) => item?.synced === false && !item?.syncFailed);

      if (unsynced.length === 0) {
        setPendingCount(0);
        return;
      }

      const apiBase = process.env.EXPO_PUBLIC_API_URL;

      for (let i = 0; i < records.length; i += 1) {
        const item = records[i];
        if (!item || item.synced || item.syncFailed) continue;

        const payload = {
          patient: item.patient,
          critical: item.critical,
          vitals: item.vitals || {},
          clinical: item.clinical || {},
          medications: item.medications || [],
          allergies: item.allergies || [],
          transferReason: item.transferReason || item.critical?.transferReason,
          primaryDiagnosis: item.primaryDiagnosis || '',
          clinicalSummary: item.clinicalSummary || '',
          sendingHospital: item.sendingHospital || item.sendingFacility?.hospitalName,
          receivingHospital: item.receivingHospital || item.receivingFacility?.hospitalName,
          sendingFacility: {
            hospitalName: item.sendingHospital || item.sendingFacility?.hospitalName,
            department: item.sendingFacility?.department || 'General',
          },
          receivingFacility: {
            hospitalName: item.receivingHospital || item.receivingFacility?.hospitalName,
          },
          transfer: item.transfer,
          offlineId: item.offlineId,
        };

        try {
          let response;
          if (api) {
            response = await api.post('/transfers', payload);
          } else {
            if (!apiBase) {
              throw new Error('EXPO_PUBLIC_API_URL missing');
            }
            response = await axios.post(`${apiBase}/api/transfers`, payload);
          }

          if (response?.status === 201) {
            records[i] = {
              ...item,
              synced: true,
              transferId: response?.data?.transfer?.transferID || response?.data?.transferId || item.transferId,
              syncedAt: new Date().toISOString(),
              syncAttempts: (item.syncAttempts || 0) + 1,
            };
            console.log(`[Sync] Synced: ${item?.offlineId || 'unknown-id'}`);
          }
        } catch (err) {
          const attempts = (item.syncAttempts || 0) + 1;
          records[i] = {
            ...item,
            syncAttempts: attempts,
            syncFailed: attempts >= 3,
          };
          setSyncError(err?.response?.data?.error || err?.message || 'Sync failed');
          console.log(`[Sync] Failed: ${item?.offlineId || 'unknown-id'} | ${err?.message}`);
        }
      }

      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(records));
      const remaining = records.filter((item) => item?.synced === false).length;
      setPendingCount(remaining);
      setLastSyncAt(new Date());

      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({ lastSyncAt: new Date().toISOString() })
      );
    } catch (err) {
      setSyncError(err?.message || 'Sync failed');
      console.log('[Sync] Fatal error:', err);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [api, isOnline]);

  const clearSyncedTransfers = useCallback(async () => {
    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const records = existing ? JSON.parse(existing) : [];
      const safeRecords = Array.isArray(records) ? records : [];
      const filtered = safeRecords.filter((item) => item?.synced === false);
      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(filtered));
      setPendingCount(filtered.length);
    } catch (error) {
      console.log('clearSyncedTransfers error:', error);
    }
  }, []);

  const resetFailedTransfers = useCallback(async () => {
    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const records = existing ? JSON.parse(existing) : [];
      const safeRecords = Array.isArray(records) ? records : [];

      const resetRecords = safeRecords.map((item) => ({
        ...item,
        synced: false,
        syncFailed: false,
        syncAttempts: 0,
      }));

      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(resetRecords));
      setPendingCount(resetRecords.filter((item) => item?.synced === false).length);
      setSyncError(null);
      return resetRecords.length;
    } catch (error) {
      console.log('resetFailedTransfers error:', error);
      return 0;
    }
  }, []);

  const repairPendingTransfers = useCallback(async () => {
    try {
      console.log('[OfflineSync] Manual repair started');
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const records = existing ? JSON.parse(existing) : [];
      const safeRecords = Array.isArray(records) ? records : [];

      if (safeRecords.length === 0) {
        console.log('[OfflineSync] Manual repair skipped: no records');
        return { repaired: 0, unresolved: 0 };
      }

      let hospitals = [];
      try {
        if (api) {
          const hospitalResponse = await api.get('/hospitals');
          hospitals = hospitalResponse?.data?.hospitals || hospitalResponse?.data || [];
        } else {
          const apiBase = process.env.EXPO_PUBLIC_API_URL;
          if (apiBase) {
            const hospitalResponse = await axios.get(`${apiBase}/api/hospitals`);
            hospitals = hospitalResponse?.data?.hospitals || hospitalResponse?.data || [];
          }
        }
      } catch (hospitalError) {
        hospitals = [];
      }

      const normalizedHospitals = Array.isArray(hospitals) ? hospitals : [];
      const resolveHospitalIdByName = (name) => {
        if (!name) return null;
        const normalizedName = normalizeName(name);

        let match = normalizedHospitals.find((hospital) => {
          const candidate = normalizeName(hospital?.name || hospital?.hospitalName);
          return candidate === normalizedName;
        });

        if (!match) {
          match = normalizedHospitals.find((hospital) => {
            const candidate = normalizeName(hospital?.name || hospital?.hospitalName);
            return candidate.includes(normalizedName) || normalizedName.includes(candidate);
          });
        }

        return match?._id || match?.hospitalID || match?.id || null;
      };

      let repaired = 0;
      let unresolved = 0;

      const updated = safeRecords.map((item) => {
        if (!item || item.synced) return item;

        const receivingHospitalID =
          item?.receivingFacility?.hospitalID ||
          item?.receivingFacility?._id ||
          item?.receivingFacility?.id ||
          resolveHospitalIdByName(item?.receivingFacility?.hospitalName || item?.receivingFacility?.name || item?.receivingHospital);

        if (!receivingHospitalID) {
          unresolved += 1;
          return item;
        }

        repaired += 1;
        return {
          ...item,
          receivingFacility: {
            ...(item.receivingFacility || {}),
            hospitalID: receivingHospitalID,
            hospitalName:
              item?.receivingFacility?.hospitalName ||
              item?.receivingFacility?.name ||
              item?.receivingHospital,
          },
          syncFailed: false,
        };
      });

      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(updated));
      setPendingCount(updated.filter((item) => item?.synced === false).length);

      console.log(`[OfflineSync] Manual repair completed | repaired=${repaired} unresolved=${unresolved}`);
      if (repaired > 0) {
        setSyncError(null);
      }

      return { repaired, unresolved };
    } catch (error) {
      console.log('[OfflineSync] Manual repair failed:', error?.message || error);
      return { repaired: 0, unresolved: 0 };
    }
  }, [api]);

  useEffect(() => {
    const cameOnline = prevOnlineRef.current === false && isOnline === true;
    prevOnlineRef.current = isOnline;

    if (cameOnline) {
      console.log('[OfflineSync] Connectivity restored. Scheduling auto-sync in 2000ms');
      const timer = setTimeout(() => {
        syncPendingTransfers();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, syncPendingTransfers]);

  useEffect(() => {
    const loadSyncState = async () => {
      try {
        const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
        const records = existing ? JSON.parse(existing) : [];
        const safeRecords = Array.isArray(records) ? records : [];

        setPendingCount(safeRecords.filter((item) => item?.synced === false).length);

        const syncStatus = await AsyncStorage.getItem(SYNC_STATUS_KEY);
        if (syncStatus) {
          const parsed = JSON.parse(syncStatus);
          if (parsed?.lastSyncAt) {
            setLastSyncAt(new Date(parsed.lastSyncAt));
          }
        }
      } catch (error) {
        console.log('loadSyncState error:', error);
      }
    };

    loadSyncState();
  }, []);

  return {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncError,
    savePendingTransfer,
    getPendingTransfers,
    syncPendingTransfers,
    clearSyncedTransfers,
    resetFailedTransfers,
    repairPendingTransfers,
  };
}
