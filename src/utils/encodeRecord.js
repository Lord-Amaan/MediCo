// The receiver website should detect URL vs base64 format.
// 1) If value starts with http => fetch from server
// 2) If value is base64 => decode locally

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const pruneEmpty = (value) => {
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => pruneEmpty(item))
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (isObject(item) && Object.keys(item).length === 0) return false;
        return true;
      });
    return cleanedArray;
  }

  if (isObject(value)) {
    const cleanedObject = {};
    Object.keys(value).forEach((key) => {
      const cleaned = pruneEmpty(value[key]);
      if (cleaned === null || cleaned === undefined) return;
      if (Array.isArray(cleaned) && cleaned.length === 0) return;
      if (isObject(cleaned) && Object.keys(cleaned).length === 0) return;
      cleanedObject[key] = cleaned;
    });
    return cleanedObject;
  }

  return value;
};

function safeBtoa(input) {
  if (typeof btoa === 'function') {
    return btoa(input);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  throw new Error('btoa not available');
}

function safeAtob(input) {
  if (typeof atob === 'function') {
    return atob(input);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('utf8');
  }
  throw new Error('atob not available');
}

function encodeRecordForQR(record) {
  try {
    const medications = (record?.medications || []).map((med) => {
      if (typeof med === 'string') {
        return { n: med };
      }
      return {
        n: med?.name,
        d: med?.dose,
        r: med?.route,
        f: med?.frequency,
        ms: med?.mustNotStop,
      };
    });

    const compact = {
      id: record?.transferId || record?.offlineId,
      v: 1,
      ts: Date.now(),
      p: {
        n: record?.patient?.name,
        a: record?.patient?.age,
        g: record?.patient?.gender,
      },
      c: {
        al: record?.critical?.allergies || record?.allergies || [],
        tr: record?.critical?.transferReason || record?.transferReason,
        dx: record?.critical?.primaryDiagnosis || record?.primaryDiagnosis,
      },
      m: medications,
      vt: {
        bp: record?.vitals?.bloodPressure,
        hr: record?.vitals?.pulse || record?.vitals?.heartRate,
        o2: record?.vitals?.spo2 || record?.vitals?.oxygenSaturation,
        t: record?.vitals?.temp || record?.vitals?.temperature,
        rr: record?.vitals?.rr || record?.vitals?.respiratoryRate,
      },
      cs: String(record?.clinicalSummary || record?.clinical?.summary || '').slice(0, 500),
      sh: record?.sendingHospital || record?.sendingFacility?.hospitalName || record?.sendingFacility?.name,
      rh: record?.receivingHospital || record?.receivingFacility?.hospitalName || record?.receivingFacility?.name,
      exp: Date.now() + 72 * 60 * 60 * 1000,
    };

    const cleaned = pruneEmpty(compact);
    const serialized = JSON.stringify(cleaned);
    return safeBtoa(serialized);
  } catch (error) {
    return '';
  }
}

function decodeRecordFromQR(encoded) {
  try {
    const decodedText = safeAtob(String(encoded || ''));
    const parsed = JSON.parse(decodedText);

    if (parsed?.exp && parsed.exp < Date.now()) {
      throw new Error('QR_EXPIRED');
    }

    return {
      transferId: parsed?.id,
      offlineId: parsed?.id,
      version: parsed?.v,
      createdAt: parsed?.ts ? new Date(parsed.ts).toISOString() : undefined,
      patient: {
        name: parsed?.p?.n,
        age: parsed?.p?.a,
        gender: parsed?.p?.g,
      },
      critical: {
        allergies: parsed?.c?.al || [],
        transferReason: parsed?.c?.tr,
        primaryDiagnosis: parsed?.c?.dx,
      },
      medications: (parsed?.m || []).map((med) => ({
        name: med?.n,
        dose: med?.d,
        route: med?.r,
        frequency: med?.f,
        mustNotStop: med?.ms,
      })),
      vitals: {
        bloodPressure: parsed?.vt?.bp,
        pulse: parsed?.vt?.hr,
        spo2: parsed?.vt?.o2,
        temp: parsed?.vt?.t,
        rr: parsed?.vt?.rr,
      },
      clinicalSummary: parsed?.cs,
      sendingHospital: parsed?.sh,
      receivingHospital: parsed?.rh,
      exp: parsed?.exp,
    };
  } catch (error) {
    if (error?.message === 'QR_EXPIRED') {
      throw error;
    }
    return null;
  }
}

function isOfflineQR(qrValue) {
  const value = String(qrValue || '').trim();
  if (!value) return false;
  if (value.startsWith('OFFLINE-')) return true;
  if (value.startsWith('ey')) return true;
  if (!value.startsWith('http')) return true;
  return false;
}

export { encodeRecordForQR, decodeRecordFromQR, isOfflineQR };
