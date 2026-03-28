import * as Crypto from 'expo-crypto';

async function generateOfflineId() {
  try {
    const randomId = Crypto.randomUUID();
    return `OFFLINE-TRF-${randomId}`;
  } catch (error) {
    return `OFFLINE-TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export { generateOfflineId };
