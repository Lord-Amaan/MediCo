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
    if (isSyncingRef.current) {
      console.log('[OfflineSync] Sync skipped: already syncing');
      return;
    }

    if (!isOnline) {
      console.log('[OfflineSync] Sync skipped: device offline');
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);
    console.log('[OfflineSync] Sync started');

    try {
      const existing = await AsyncStorage.getItem(PENDING_TRANSFERS_KEY);
      const allRecords = existing ? JSON.parse(existing) : [];
      const records = Array.isArray(allRecords) ? allRecords : [];

      const unsynced = records.filter((item) => item?.synced === false && !item?.syncFailed);
      if (unsynced.length === 0) {
        console.log('[OfflineSync] No pending records to sync');
        setPendingCount(records.filter((item) => item?.synced === false).length);
        setIsSyncing(false);
        isSyncingRef.current = false;
        return;
      }

      const apiBase = process.env.EXPO_PUBLIC_API_URL;
      if (!apiBase && !api) {
        setSyncError('EXPO_PUBLIC_API_URL missing and auth API unavailable');
        setIsSyncing(false);
        isSyncingRef.current = false;
        return;
      }

      let hospitals = [];
      try {
        if (api) {
          const hospitalResponse = await api.get('/hospitals');
          hospitals = hospitalResponse?.data?.hospitals || hospitalResponse?.data || [];
        } else {
          const hospitalResponse = await axios.get(`${apiBase}/api/hospitals`);
          hospitals = hospitalResponse?.data?.hospitals || hospitalResponse?.data || [];
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

      for (let index = 0; index < records.length; index += 1) {
        const item = records[index];
        if (!item || item.synced || item.syncFailed) continue;

        const normalizedItem = {
          ...item,
          sendingFacility: {
            ...(item.sendingFacility || {}),
            hospitalID:
              item?.sendingFacility?.hospitalID ||
              item?.sendingFacility?._id ||
              item?.sendingFacility?.id ||
              resolveHospitalIdByName(item?.sendingFacility?.hospitalName || item?.sendingHospital),
          },
          receivingFacility: {
            ...(item.receivingFacility || {}),
            hospitalID:
              item?.receivingFacility?.hospitalID ||
              item?.receivingFacility?._id ||
              item?.receivingFacility?.id ||
              resolveHospitalIdByName(item?.receivingFacility?.hospitalName || item?.receivingHospital),
            hospitalName:
              item?.receivingFacility?.hospitalName ||
              item?.receivingFacility?.name ||
              item?.receivingHospital,
          },
        };

        records[index] = normalizedItem;

        if (!normalizedItem?.receivingFacility?.hospitalID) {
          const attempts = (item.syncAttempts || 0) + 1;
          records[index] = {
            ...normalizedItem,
            syncAttempts: attempts,
            syncFailed: attempts >= 3,
          };
          const missingIdMsg = 'Receiving facility ID missing in offline record';
          setSyncError(missingIdMsg);
          console.log(`[OfflineSync] Cannot sync ${item?.offlineId || 'unknown-id'}: ${missingIdMsg}`);
          continue;
        }

        try {
          let response;
          if (api) {
            // Prefer authenticated API client because /transfers route is protected.
            response = await api.post('/transfers', normalizedItem);
          } else {
            response = await axios.post(`${apiBase}/api/transfers`, normalizedItem);
          }

          if (response?.status === 201) {
            console.log(`[OfflineSync] Synced: ${item?.offlineId || item?.transferId || 'unknown-id'}`);
            records[index] = {
              ...item,
              synced: true,
              transferId: response?.data?.transfer?.transferID || response?.data?.transferId || item.transferId,
              syncedAt: new Date().toISOString(),
              syncAttempts: (item.syncAttempts || 0) + 1,
            };
          } else {
            const attempts = (item.syncAttempts || 0) + 1;
            console.log(`[OfflineSync] Non-201 response for ${item?.offlineId || 'unknown-id'} | status=${response?.status} | attempts=${attempts}`);
            records[index] = {
              ...item,
              syncAttempts: attempts,
              syncFailed: attempts >= 3,
            };
          }
        } catch (error) {
          const attempts = (item.syncAttempts || 0) + 1;
          console.log(
            `[OfflineSync] Sync failed for ${item?.offlineId || 'unknown-id'} | status=${error?.response?.status || 'n/a'} | attempts=${attempts} | message=${error?.message}`
          );
          records[index] = {
            ...item,
            syncAttempts: attempts,
            syncFailed: attempts >= 3,
          };

          if (!syncError) {
            const message = error?.response?.data?.error || error?.message || 'Sync failed';
            setSyncError(message);
          }
        }
      }

      await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(records));
      const remainingUnsynced = records.filter((item) => item?.synced === false).length;
      setPendingCount(remainingUnsynced);
      console.log(`[OfflineSync] Sync completed | remaining unsynced=${remainingUnsynced}`);

      const now = new Date();
      setLastSyncAt(now);
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ lastSyncAt: now.toISOString() }));
    } catch (error) {
      console.log('syncPendingTransfers error:', error);
      setSyncError(error?.message || 'Sync failed');
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

        // One-time migration: backfill missing receivingFacility.hospitalID for old offline records.
        let migratedRecords = [...safeRecords];
        try {
          let hospitals = [];
          if (api) {
            const hospitalResponse = await api.get('/hospitals');
            hospitals = hospitalResponse?.data?.hospitals || hospitalResponse?.data || [];
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

          let changed = false;
          migratedRecords = safeRecords.map((item) => {
            if (!item || item.synced) return item;
            const existingReceivingId =
              item?.receivingFacility?.hospitalID || item?.receivingFacility?._id || item?.receivingFacility?.id;
            if (existingReceivingId) return item;

            const resolvedId = resolveHospitalIdByName(
              item?.receivingFacility?.hospitalName || item?.receivingFacility?.name || item?.receivingHospital
            );

            if (!resolvedId) return item;

            changed = true;
            return {
              ...item,
              receivingFacility: {
                ...(item.receivingFacility || {}),
                hospitalID: resolvedId,
                hospitalName:
                  item?.receivingFacility?.hospitalName ||
                  item?.receivingFacility?.name ||
                  item?.receivingHospital,
              },
            };
          });

          if (changed) {
            await AsyncStorage.setItem(PENDING_TRANSFERS_KEY, JSON.stringify(migratedRecords));
            console.log('[OfflineSync] Migrated pending records with missing receiving facility IDs');
          }
        } catch (migrationError) {
          console.log('[OfflineSync] Migration skipped:', migrationError?.message || migrationError);
        }

        setPendingCount(migratedRecords.filter((item) => item?.synced === false).length);

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
  }, [api]);

  return {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncError,
    savePendingTransfer,
    getPendingTransfers,
    syncPendingTransfers,
    clearSyncedTransfers,
    repairPendingTransfers,
  };
}
