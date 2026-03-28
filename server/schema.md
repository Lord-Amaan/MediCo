# MediCo Patient Transfer Handoff - MongoDB Schema Design

## Overview

End-to-end schema for structured patient transfer records between hospitals with offline-first capability, critical info surfacing, and transfer history tracking.

---

## Core Collections

### 1. **transfers** (Main Collection)

Stores each patient transfer record with all critical information.

```javascript
{
  _id: ObjectId,

  // ============================================================================
  // PATIENT IDENTIFIERS
  // ============================================================================
  patient: {
    name: String,           // "John Doe" (MANDATORY)
    age: Number,            // 65 (MANDATORY)
    gender: String,         // "Male" | "Female" | "Other"
    patientID: String,      // Hospital MRN (MANDATORY)
    dateOfBirth: Date,
    phone: String,          // Optional contact
    address: String,        // For reference
  },

  // ============================================================================
  // CRITICAL INFORMATION (Shown First - Large Text)
  // ============================================================================
  critical: {
    allergies: [
      {
        name: String,       // "Penicillin", "Aspirin"
        severity: String,   // "Mild" | "Moderate" | "Severe" (MANDATORY)
        reaction: String,   // "Rash", "Anaphylaxis" (MANDATORY)
      }
    ],

    activeMedications: [
      {
        name: String,       // "Metformin" (MANDATORY)
        dose: String,       // "500mg" (MANDATORY)
        route: String,      // "Oral" | "IV" | "Injection" (MANDATORY)
        frequency: String,  // "BID" | "TID" | "OD" (MANDATORY)
        indication: String, // Why this medication
        startDate: Date,
        mustNotStop: Boolean, // Flag if critical (e.g., insulin)
      }
    ],

    transferReason: String, // "Hypertensive crisis" (MANDATORY)
    primaryDiagnosis: String, // "Essential Hypertension"
  },

  // ============================================================================
  // VITAL SIGNS & CLINICAL STATUS
  // ============================================================================
  vitals: {
    bloodPressure: String,     // "140/90"
    heartRate: Number,         // 88 (bpm)
    respiratoryRate: Number,   // 20 (breaths/min)
    temperature: Number,       // 37.5 (°C)
    oxygenSaturation: Number,  // 98 (%)
    bloodGlucose: Number,      // mg/dL (if diabetic)
    recordedAt: Date,          // When vitals were taken
  },

  // ============================================================================
  // CLINICAL INFORMATION
  // ============================================================================
  clinical: {
    recentInvestigations: [
      {
        testName: String,       // "ECG", "Blood Culture"
        result: String,         // "Abnormal", "Pending", "Normal"
        findings: String,       // Brief description
        date: Date,
        critical: Boolean,      // Flag if urgent result
      }
    ],

    pastMedicalHistory: [String], // ["DM Type 2", "HTN", "CAD"]

    surgicalHistory: [
      {
        procedure: String,
        date: Date,
        outcome: String,
      }
    ],

    clinicalSummary: String,    // Max 200 words, free-text clinical notes
    clinicalSummaryVoice: Boolean, // Flagged if voice-dictated
  },

  // ============================================================================
  // SENDING HOSPITAL / TEAM
  // ============================================================================
  sendingFacility: {
    hospitalName: String,       // "City Primary Health Centre"
    hospitalID: String,         // Hospital code
    department: String,         // "ICU", "Emergency", "Ward"
    doctorName: String,         // Doctor preparing transfer
    doctorID: String,           // Employee ID
    nurseInCharge: String,      // Optional
    contactPhone: String,
    timestamp: Date,            // When form was filled
  },

  // ============================================================================
  // RECEIVING HOSPITAL / TEAM (Filled on arrival)
  // ============================================================================
  receivingFacility: {
    hospitalName: String,       // "District Hospital"
    hospitalID: String,
    department: String,
    doctorName: String,
    doctorID: String,
    nurseInCharge: String,
    contactPhone: String,
    estimatedArrivalTime: Date, // When patient is expected
  },

  // ============================================================================
  // TRANSFER TRACKING
  // ============================================================================
  transfer: {
    transferID: String,         // Unique: HOSP1_2024_00123
    mode: String,               // "Ambulance" | "Flight" | "Self" | "Other"
    reason: String,             // Clinical or logistical
    medicalEscort: Boolean,     // Was doctor/nurse accompanying?
    escort: {
      name: String,
      qualification: String,
    },
    startTime: Date,
    estimatedDuration: Number,  // minutes
    actualArrivalTime: Date,
    status: String,             // "Pending" | "Transferred" | "Received" | "Acknowledged"
  },

  // ============================================================================
  // RECEIVING TEAM ACKNOWLEDGEMENT
  // ============================================================================
  acknowledgement: {
    reviewed: Boolean,
    reviewedBy: {
      name: String,
      role: String,             // "Doctor" | "Nurse"
      timestamp: Date,
    },

    arrivalNotes: String,       // Patient condition on arrival
    discrepancies: [
      {
        field: String,          // "medication" | "allergy" | "vital"
        issue: String,          // Description of discrepancy
        action: String,         // What was done about it
        timestamp: Date,
      }
    ],

    flaggedIssues: [String],    // e.g., ["Patient says stopped Metformin", "Allergy mismatch"]

    immediateActions: [String], // Actions taken immediately

    acknowledgementTime: Date,
    synced: Boolean,            // Has this been synced to server?
    syncedAt: Date,
  },

  // ============================================================================
  // ALLERGY-DRUG INTERACTION CHECKING
  // ============================================================================
  interactionCheck: {
    status: String,             // "Checked" | "Pending" | "No Conflicts"
    allergies: Array,           // Allergies flagged
    medications: Array,         // Medications flagged
    conflicts: [
      {
        severity: String,       // "Critical" | "Warning" | "Info"
        allergen: String,
        medication: String,
        reason: String,         // Why this is a conflict
        recommendation: String, // What to do
      }
    ],
    checkedAt: Date,
    checkedBy: String,          // Doctor who confirmed
  },

  // ============================================================================
  // QR CODE & SHAREABLE LINK
  // ============================================================================
  sharing: {
    qrCodeData: String,         // Full record encoded in QR (for offline)
    qrCodeURL: String,          // Link to QR code image (if stored)
    shareLink: String,          // Short URL: medico.app/t/abc123
    shareLinkExpiry: Date,      // When link expires (optional)
    shareToken: String,         // Unique token for this transfer
    readonlyLink: Boolean,      // Receiving team gets read-only access
    linkedRecords: [ObjectId],  // Related transfer records
  },

  // ============================================================================
  // OFFLINE SYNC METADATA
  // ============================================================================
  sync: {
    createdLocally: Boolean,    // Was this created offline?
    localTimestamp: Date,       // When created on client
    syncedToServer: Boolean,
    syncedAt: Date,
    syncConflict: Boolean,      // Did sync cause a conflict?
    conflictResolution: String, // "serverWins" | "clientWins" | "manual"
    lastModified: Date,
    lastModifiedBy: String,     // User who made changes
    version: Number,            // For conflict resolution
  },

  // ============================================================================
  // AUDIT & COMPLIANCE
  // ============================================================================
  audit: {
    createdAt: Date,            // Server timestamp
    updatedAt: Date,
    createdBy: {
      userId: String,
      role: String,
      facility: String,
    },
    editHistory: [
      {
        timestamp: Date,
        field: String,
        oldValue: String,
        newValue: String,
        editedBy: String,
      }
    ],
    deleted: Boolean,           // Soft delete
    deletedAt: Date,
    deletionReason: String,
  },

  // ============================================================================
  // PATIENT TRANSFER HISTORY REFERENCE
  // ============================================================================
  relatedTransfers: [
    {
      transferID: ObjectId,
      date: Date,
      fromFacility: String,
      toFacility: String,
    }
  ],

  // Track patient lifetime transfers
  patientTransferSequence: Number, // 1st, 2nd, 3rd transfer
}
```

---

### 2. **patients** (Patient Master Data)

Stores patient demographic data + transfer history summary.

```javascript
{
  _id: ObjectId,

  patientID: String,            // Primary MRN (UNIQUE)
  name: String,
  dateOfBirth: Date,
  gender: String,
  phone: String,

  // Master allergy list (updated across all transfers)
  masterAllergies: [
    {
      name: String,
      severity: String,
      reaction: String,
      confirmedDate: Date,
      confirmedBy: String,
    }
  ],

  // Master medication history
  masterMedications: [
    {
      name: String,
      indication: String,
      startDate: Date,
      endDate: Date,
      status: String,           // "Active" | "Stopped" | "Paused"
    }
  ],

  // Transfer count + summary
  totalTransfers: Number,
  lastTransferDate: Date,
  lastTransferFromFacility: String,
  lastTransferToFacility: String,

  // Quick links to transfer records
  transferHistory: [
    {
      transferID: ObjectId,
      date: Date,
      fromFacility: String,
      toFacility: String,
      transferReason: String,
    }
  ],

  // Chronic conditions
  chronicalDiagnosis: [String],

  // Metadata
  registeredAt: Date,
  registeredFacility: String,
  updatedAt: Date,
  dataQuality: {
    allergiesVerified: Boolean,
    medicationsVerified: Boolean,
    lastVerificationDate: Date,
  }
}
```

---

### 3. **hospitals** (Facility Registry)

Master data for sending/receiving hospitals.

```javascript
{
  _id: ObjectId,

  hospitalID: String,           // Unique code: HOSP_001 (UNIQUE)
  name: String,
  type: String,                 // "PHC" | "CHC" | "District" | "Tertiary"
  city: String,
  state: String,

  contact: {
    phone: String,
    email: String,
    emergencyContact: String,
  },

  departments: [
    {
      name: String,             // "ICU", "Emergency", "Cardiology"
      contactPerson: String,
      phone: String,
    }
  ],

  capabilities: [String],       // ["ICU", "Cardiac Care", "Ventilator", "NICU"]

  apiKey: String,               // For API access
  isActive: Boolean,
  registeredAt: Date,
}
```

---

### 4. **users** (Staff/Doctor Registry)

Stores authorized users who can send/receive transfers.

```javascript
{
  _id: ObjectId,

  userID: String,               // Employee ID (UNIQUE)
  name: String,
  email: String,
  phone: String,

  hospital: {
    hospitalID: ObjectId,
    hospitalName: String,
    department: String,
  },

  role: String,                 // "Doctor" | "Nurse" | "Admin"
  qualifications: [String],    // Medical licenses, certifications

  permissions: [String],        // "Create_Transfer" | "Review_Transfer" | "Admin"

  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,

  // For authentication
  passwordHash: String,         // Hashed password
  lastLogin: Date,
  loginAttempts: Number,
  lockedUntil: Date,            // Account lockout after failed attempts
}
```

---

### 5. **interactionDatabase** (Drug-Allergy Reference)

Bundled reference database for allergy-drug conflict checking.

```javascript
{
  _id: ObjectId,

  allergen: String,             // "Penicillin" (UNIQUE with medication)
  medication: String,           // "Amoxicillin"

  severity: String,             // "Critical" | "Warning" | "Info"
  reason: String,               // Why this is unsafe
  recommendation: String,       // "Avoid entirely" | "Use with caution"

  category: String,             // "Antibiotic" | "Analgesic" | "Cardiovascular"

  // Version control for offline bundle
  bundleVersion: Number,
  lastUpdated: Date,
}
```

---

### 6. **auditLogs** (Compliance & Security)

Complete audit trail for every action.

```javascript
{
  _id: ObjectId,

  timestamp: Date,
  action: String,               // "Transfer_Created" | "Transfer_Acknowledged" | "Data_Accessed"

  actor: {
    userID: String,
    name: String,
    role: String,
    hospital: String,
  },

  target: {
    transferID: ObjectId,
    patientID: String,
    patientName: String,
  },

  details: String,              // Description of action

  // For security
  ipAddress: String,
  userAgent: String,

  // Sensitive data access
  sensitiveDataAccessed: Boolean,
  dataFields: [String],         // Which fields were accessed

  deviceInfo: {
    platform: String,           // "iOS" | "Android" | "Web"
    appVersion: String,
    offline: Boolean,           // Was this offline?
  }
}
```

---

## Indexes & Performance

```javascript
// Critical for search performance
db.transfers.createIndex({ "patient.patientID": 1 });
db.transfers.createIndex({ "sharing.shareToken": 1 });
db.transfers.createIndex({ "transfer.transferID": 1 });
db.transfers.createIndex({ "transfer.status": 1 });
db.transfers.createIndex({ "sendingFacility.timestamp": -1 });
db.transfers.createIndex({ "receivingFacility.hospitalName": 1 });

db.patients.createIndex({ patientID: 1 });
db.patients.createIndex({ "transferHistory.transferID": 1 });

db.hospitals.createIndex({ hospitalID: 1 });
db.users.createIndex({ userID: 1 });
db.users.createIndex({ "hospital.hospitalID": 1 });
db.interactionDatabase.createIndex({ allergen: 1, medication: 1 });

db.auditLogs.createIndex({ timestamp: -1 });
db.auditLogs.createIndex({ "actor.userID": 1 });
db.auditLogs.createIndex({ "target.patientID": 1 });
```

---

## Offline-First Sync Strategy

### Client-Side (React Native)

```
1. Create transfer locally (AsyncStorage/SQLite)
2. Encode full data in QR code (no server needed)
3. When online, sync to server with `sync.version`
4. Server checks for conflicts:
   - If version matches: Accept
   - If version mismatch: Resolve (server wins OR manual)
5. Mark as `syncedToServer: true`
```

### Conflict Resolution

```
- Use version numbers for optimistic concurrency
- Server-side validation prevents duplicates
- Acknowledgement stays local until connectivity
- Flag for manual review if conflicts occur
```

---

## Query Examples

### Get Critical Info for Receiving Doctor

```javascript
db.transfers.findOne(
  { "sharing.shareToken": "abc123" },
  {
    critical: 1,
    "patient.name": 1,
    vitals: 1,
    "sendingFacility.hospitalName": 1,
    "transfer.transferReason": 1,
  },
);
```

### Get Patient Transfer History

```javascript
db.transfers.find(
  { "patient.patientID": "MRN123" },
  { sort: { "sendingFacility.timestamp": -1 }, limit: 10 },
);
```

### Check for Drug-Allergy Conflicts

```javascript
db.interactionDatabase.find({
  allergen: { $in: patientAllergies },
  medication: { $in: prescribedMeds },
});
```

### Audit Trail for Compliance

```javascript
db.auditLogs
  .find({
    "target.patientID": "MRN123",
    timestamp: { $gte: startDate, $lte: endDate },
  })
  .sort({ timestamp: -1 });
```

---

## Security Considerations

1. **Patient Data Encryption**: Encrypt PII at rest and in transit
2. **Role-Based Access**: Only authorized staff can view records
3. **Audit Logging**: Every access is logged
4. **Share Link Expiry**: QR links expire after 30 days
5. **Offline Data**: Encrypt local data on device
6. **API Authentication**: Use JWT tokens for API calls
7. **Data Minimization**: Don't store unnecessary info
8. **HIPAA Compliance**: Request/acknowledge informed consent

---

## Notes

- **Offline QR**: Full record encoded in QR, no server lookup needed
- **Critical First**: Always show allergies, meds, transfer reason first
- **Conflict Tracking**: Discrepancies logged for quality improvement
- **Transfer Sequence**: Track patient movement across facilities
- **Voice Dictation**: Flag if clinical summary was voice-dictated (for review)
- **Sync Conflicts**: Handled gracefully with version numbers
