# How MongoDB Models Work Together - Complete Guide

## Overview

You have 6 models that interact to create a complete patient transfer system. Think of them as **interconnected tables** where data flows between them.

```
                          ┌─────────────────────┐
                          │   InteractionDB     │
                          │ (Drug-Allergy Ref)  │
                          └──────────┬──────────┘
                                     │ checks for conflicts
                                     ▼
    ┌────────────┐      ┌──────────────────────┐      ┌──────────────┐
    │  Hospital  │◄────►│      Transfer        │◄────►│   Patient    │
    │ (Registry) │      │ (Main Record)        │      │ (Master Rec) │
    └────────────┘      └────────┬─────────────┘      └──────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              ┌──────────────┐          ┌──────────────┐
              │    User      │          │  AuditLog    │
              │ (Staff/Docs) │          │ (Compliance) │
              └──────────────┘          └──────────────┘
```

---

## Model 1: Transfer (The Hub)

**Purpose:** Main transfer record. Every patient transfer creates ONE Transfer document.

```javascript
Transfer: {
  _id: "ObjectId_123",
  patient: { ... },           // Which patient?
  critical: { ... },          // What's critical info?
  sendingFacility: { },       // Which hospital sending?
  receivingFacility: { },     // Which hospital receiving?
  acknowledgement: { },       // Who received it?
  sharing: { }                // QR code + link
}
```

**Who uses it?**

- ✅ Sending doctor (fills it)
- ✅ Receiving doctor (reads it)
- ✅ Nurses (reference)
- ✅ Admin (auditing)

**Connections:**

- `patient.patientID` → Links to **Patient** model
- `sendingFacility.hospitalID` → Links to **Hospital** model
- `sendingFacility.doctorName` → Links to **User** model
- Checks allergies/meds against **InteractionDatabase**
- Every action logged in **AuditLog**

---

## Model 2: Patient (Master Record)

**Purpose:** Stores patient demographic + transfer history.

```javascript
Patient: {
  _id: "ObjectId_456",
  patientID: "MRN_12345",           // Unique ID
  name: "Rajesh Kumar",
  dateOfBirth: "1959-03-15",

  // LINKED DATA from previous transfers:
  masterAllergies: [                // Built from all past transfers
    { name: "Aspirin", severity: "Severe", confirmedDate: "2026-01-15" }
  ],

  masterMedications: [              // Complete med history
    { name: "Metoprolol", startDate: "2024-05-20", status: "Active" }
  ],

  transferHistory: [                // All past transfers
    { transferID: "TRANSFER_001", date: "2026-03-15", fromFacility: "Clinic A" },
    { transferID: "TRANSFER_002", date: "2026-03-28", fromFacility: "PHC" }
  ]
}
```

**How it's built:**

1. **First transfer created** → New Patient document created
2. **Subsequent transfers** → Patient doc updated with new allergies/meds/history
3. **Receiving doctor checks history** → Sees past 5 transfers, past issues

**Example:**

```
Time 1: Rajesh transferred from Clinic A → Patient created
  masterAllergies: [Aspirin]
  transferHistory: [TRANSFER_001]

Time 2: Same patient transferred from PHC → Patient updated
  masterAllergies: [Aspirin, Ibuprofen] ← NEW allergy discovered
  transferHistory: [TRANSFER_001, TRANSFER_002] ← NEW transfer added
```

---

## Model 3: Hospital (Facility Registry)

**Purpose:** Master list of all hospitals in the network.

```javascript
Hospital: {
  _id: "ObjectId_789",
  hospitalID: "HOSP_DIST_001",      // Unique code
  name: "District Hospital ABC",
  type: "District",                  // PHC | CHC | District | Tertiary

  departments: [
    { name: "Cardiology", contactPerson: "Dr. Sharma", phone: "..." },
    { name: "ICU", contactPerson: "Dr. Patel", phone: "..." }
  ],

  capabilities: [                    // What can they do?
    "ICU",
    "Cardiac Care",
    "Ventilator Support",
    "NICU"
  ]
}
```

**Why it exists:**

- Quick lookup: "Is District Hospital equipped for cardiac care?" → YES
- Contact info: Who's the cardiology head? → Dr. Sharma
- Filtering: "Show me only tertiary hospitals" → Filter by type

**How it's used in Transfer:**

```javascript
// When creating transfer:
transfer: {
  sendingFacility: {
    hospitalID: "HOSP_PHC_001",      // References Hospital model
    hospitalName: "Rural PHC"
  },
  receivingFacility: {
    hospitalID: "HOSP_DIST_001",     // References Hospital model
    hospitalName: "District Hospital ABC"
  }
}

// Later, receiving doctor can check:
// "What are District Hospital's ICU capabilities?"
Hospital.findById("HOSP_DIST_001")
  → capabilities: ["ICU", "Cardiac Care", ...]
```

---

## Model 4: User (Staff Registry)

**Purpose:** Who is authorized to send/receive transfers?

```javascript
User: {
  _id: "ObjectId_321",
  userID: "DOC_001",                // Employee ID
  name: "Dr. Priya Sharma",
  email: "priya@ruralphc.com",

  hospital: {
    hospitalID: "HOSP_PHC_001",     // Which hospital?
    hospitalName: "Rural PHC",
    department: "Emergency"
  },

  role: "Doctor",                   // Doctor | Nurse | Admin
  permissions: [
    "Create_Transfer",
    "Review_Transfer",
    "Access_AuditLogs"
  ],

  isActive: true
}
```

**How it connects:**

```javascript
// When Transfer is created, record who did it:
transfer: {
  sendingFacility: {
    doctorName: "Dr. Priya Sharma",
    doctorID: "DOC_001"              // Links to User model
  }
}

// Later, admin checks:
// "Who created this transfer?"
Transfer → doctorID: "DOC_001"
User.findById("DOC_001") → Dr. Priya Sharma at Rural PHC

// Authorization check:
// "Can Nurse Amit mark transfer as reviewed?"
User.findById("NURSE_001") check permission: "Review_Transfer"
→ YES, proceed | NO, deny access
```

---

## Model 5: InteractionDatabase (Drug-Allergy Reference)

**Purpose:** Prevents dangerous drug-allergy conflicts.

```javascript
InteractionDatabase: {
  _id: "ObjectId_654",
  allergen: "Penicillin",
  medication: "Amoxicillin",
  severity: "Critical",
  reason: "Cross-reactivity risk in penicillin-allergic patients",
  recommendation: "AVOID entirely"
}
```

**How it's used:**

```javascript
// When sending doctor enters:
critical: {
  allergies: ["Penicillin"],
  activeMedications: ["Amoxicillin"]
}

// App checks:
InteractionDatabase.find({
  allergen: "Penicillin",
  medication: "Amoxicillin"
})

// Found conflict!
// Show: 🔴 RED ALERT
// "Patient is ALLERGIC to Penicillin!"
// "Amoxicillin is a penicillin-class antibiotic!"
// Cannot submit form without override

// If submitted anyway, log in Transfer:
interactionCheck: {
  conflicts: [
    {
      allergen: "Penicillin",
      medication: "Amoxicillin",
      severity: "Critical",
      action: "Overridden by doctor"
    }
  ]
}
```

---

## Model 6: AuditLog (Compliance & Security)

**Purpose:** Complete audit trail for every action.

```javascript
AuditLog: {
  _id: "ObjectId_111",
  timestamp: "2026-03-28T15:10:00Z",

  action: "Transfer_Created",

  actor: {
    userID: "DOC_001",
    name: "Dr. Priya Sharma",
    role: "Doctor",
    hospital: "Rural PHC"
  },

  target: {
    transferID: "TRANSFER_001",
    patientID: "MRN_12345",
    patientName: "Rajesh Kumar"
  },

  details: "Created transfer for hypertensive crisis",
  ipAddress: "192.168.1.100",
  sensitiveDataAccessed: true,
  dataFields: ["allergies", "medications", "vitals"]
}
```

**Every time something happens:**

```
Create Transfer:
  → Log: Who (Dr. Priya), What (created), When (3:10 PM), Which patient

Access Transfer:
  → Log: Who (Dr. Rajiv), What (viewed), When (4:42 PM), What data accessed

Mark as Reviewed:
  → Log: Who (Dr. Rajiv), What (acknowledged), When (4:50 PM)

Modify Transfer:
  → Log: Who changed it, What field, Old value, New value
```

**For compliance:**

```javascript
// Hospital audit: "Who accessed this patient's data?"
AuditLog.find({ "target.patientID": "MRN_12345" })[
  // Results:
  ({ actor: "Dr. Priya", action: "Transfer_Created", timestamp: "15:10" },
  { actor: "Dr. Rajiv", action: "Transfer_Accessed", timestamp: "16:42" },
  { actor: "Dr. Rajiv", action: "Transfer_Acknowledged", timestamp: "16:50" },
  { actor: "Nurse Priya", action: "Data_Accessed", timestamp: "17:00" })
];

// Hospital proves: HIPAA compliant access
```

---

## Real-World Data Flow - Step by Step

### **Scenario: Patient Rajesh transferred from PHC to District Hospital**

---

### **Step 1: Doctor at PHC Creates Transfer**

**Action:** Dr. Priya starts filling the form

```
INITIAL STATE:
- No Transfer yet
- No entry in AuditLog
```

**Doctor fills form:**

```javascript
// Transfer created
transfer: {
  patient: {
    name: "Rajesh Kumar",
    patientID: "MRN_12345"        // ← Will link to Patient model
  },

  sendingFacility: {
    hospitalID: "HOSP_PHC_001",   // ← Links to Hospital model
    doctorName: "Dr. Priya Sharma",
    doctorID: "DOC_001"           // ← Links to User model
  },

  receivingFacility: {
    hospitalID: "HOSP_DIST_001"   // ← Links to Hospital model
  },

  critical: {
    allergies: ["Aspirin"],
    activeMedications: ["Metoprolol"]
  }
}
```

**Interactions triggered:**

1. **Check InteractionDatabase:**

   ```javascript
   InteractionDatabase.find({
     allergen: "Aspirin",
     medication: "Aspirin",
   });
   // Found: CRITICAL conflict
   // Show: 🔴 "Patient allergic to Aspirin!"
   ```

2. **Check Patient model:**

   ```javascript
   Patient.findById("MRN_12345");

   // If first transfer:
   // No record found → Create new Patient

   // If second+ transfer:
   // Patient found → Check masterAllergies
   // Compare: Old allergies vs New allergies
   // Alert if NEW allergy discovered
   ```

3. **Create AuditLog entry:**
   ```javascript
   AuditLog.create({
     action: "Transfer_Created",
     actor: { userID: "DOC_001", name: "Dr. Priya Sharma" },
     target: { patientID: "MRN_12345", patientName: "Rajesh Kumar" },
     timestamp: "2026-03-28T15:10:00Z",
   });
   ```

---

### **Step 2: Dr. Priya Submits Form**

**Database state after submission:**

```javascript
// 1. TRANSFER CREATED
Transfer {
  _id: "TRANSFER_001",
  transfer: { status: "Pending" },
  sendingFacility: { doctorID: "DOC_001" }
  // ... full record
}

// 2. PATIENT UPDATED or CREATED
Patient {
  patientID: "MRN_12345",
  transferHistory: ["TRANSFER_001"],
  masterAllergies: ["Aspirin"],
  totalTransfers: 1
}

// 3. AUDIT LOGGED
AuditLog {
  action: "Transfer_Created",
  actor: { userID: "DOC_001" },
  target: { transferID: "TRANSFER_001" }
}
```

---

### **Step 3: Patient Travels (80 minutes)**

**Database state:**

```javascript
Transfer {
  transfer: { status: "Transferred" }  // Updated
}

AuditLog {
  action: "Transfer_Started",
  timestamp: "2026-03-28T15:20:00Z"
}
```

---

### **Step 4: Receiving Doctor Scans QR at District Hospital**

**Dr. Rajiv scans QR code:**

```javascript
// Look up by shareToken
Transfer.findOne({ "sharing.shareToken": "abc123xyz" });

// Get:
// - patient.name, age, ID
// - critical.allergies, medications, reason
// - vitals
// - clinical summary
// - sending facility info

// Simultaneously check Hospital record:
Hospital.findById("HOSP_PHC_001");
// Get: PHC capabilities, contact info

// Check User record:
User.findById("DOC_001");
// Get: Dr. Priya's qualifications, department

// Create AuditLog:
AuditLog.create({
  action: "Data_Accessed",
  actor: { userID: "DOC_002", name: "Dr. Rajiv Patel" },
  target: { patientID: "MRN_12345" },
  sensitiveDataAccessed: true,
  dataFields: ["allergies", "medications"],
});
```

**Dr. Rajiv sees:**

```
Critical Info (shown first):
✅ Patient: Rajesh Kumar, 65
⚠️ Allergies: Aspirin (Severe)
💊 Meds: Metoprolol (DO NOT STOP)
🚑 Reason: Hypertensive crisis

Plus full clinical details below
```

---

### **Step 5: Dr. Rajiv Marks as Reviewed**

```javascript
// Update Transfer
Transfer.updateOne(
  { _id: "TRANSFER_001" },
  {
    acknowledgement: {
      reviewed: true,
      reviewedBy: { userID: "DOC_002", name: "Dr. Rajiv Patel" },
      arrivalNotes: "Patient stable, starting IV labetalol",
    },
    transfer: { status: "Acknowledged" },
  },
);

// Update Patient (transfer count)
Patient.updateOne(
  { patientID: "MRN_12345" },
  {
    lastTransferDate: "2026-03-28",
    lastTransferToFacility: "District Hospital",
    totalTransfers: 1,
  },
);

// Log action
AuditLog.create({
  action: "Transfer_Acknowledged",
  actor: { userID: "DOC_002", name: "Dr. Rajiv Patel" },
  target: { transferID: "TRANSFER_001", patientID: "MRN_12345" },
});
```

---

### **Step 6: Patient Transferred Again (Weeks Later)**

Same patient needs transfer to Tertiary Hospital.

**New doctor checks:**

```javascript
// Query Patient record for history:
Patient.findById("MRN_12345")
.select("transferHistory masterAllergies")

// Returns:
{
  transferHistory: [
    "TRANSFER_001" → District Hospital (3 weeks ago),
    "TRANSFER_002" → PHC (1 month ago),
    ...
  ],
  masterAllergies: ["Aspirin", "NSAIDs"]  // Updated from previous transfers
}

// New doctor sees: "This patient has been transferred before!"
// Clicks on TRANSFER_001 → Sees full history
// Decides: "Cardiology workup was done at District. Let me continue that path."
```

---

## How Models Reference Each Other

### **Reference Diagram**

```
┌─────────────┐
│  Transfer   │
├─────────────┤
│ _id: "T001" │
│             │
│ patient: {  │──────────────┐
│   name,     │              │
│   patientID ├──→ "MRN123" ─┼─→ Patient._id
│ }           │              │
│             │              │
│ sending: {  │──────────────┤
│   doctorID  ├──→ "DOC_001" ─┼─→ User._id
│   hospital  ├──→ "HOSP_001" ─┼─→ Hospital._id
│ }           │              │
│             │←─ AuditLog   │
│             │   references│
│             │   this T001 │
└─────────────┘              │
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
          ┌─────────┐                  ┌─────────┐
          │ Patient │                  │ AuditLog│
          └─────────┘                  └─────────┘

Transfer CONTAINS references to:
- Patient (by patientID)
- User (by doctorID)
- Hospital (by hospitalID)
- InteractionDatabase (for checking, not storing)

AuditLog REFERENCES:
- Transfer (by transferID)
- User (by userID)
- Patient (by patientID)
```

---

## Queries Showing Model Interaction

### **Query 1: "Get all transfers for a patient with doctor details"**

```javascript
// Step 1: Find all transfers for patient
Transfer.find({ "patient.patientID": "MRN_12345" })

// Step 2: For each transfer, get sending doctor details
for (each transfer) {
  User.findById(transfer.sendingFacility.doctorID)
  // Get: Dr. Priya Sharma's hospital, qualifications, etc.
}

// Step 3: For each transfer, get hospital details
for (each transfer) {
  Hospital.findById(transfer.sendingFacility.hospitalID)
  // Get: Rural PHC's capabilities, departments, etc.
}

// Result: Complete transfer timeline with context
```

---

### **Query 2: "Audit all patient accesses in past 7 days"**

```javascript
// Step 1: Find all audit logs for patient
AuditLog.find({
  "target.patientID": "MRN_12345",
  timestamp: { $gte: 7daysAgo }
})

// Step 2: For each log, get user details
for (each log) {
  User.findById(log.actor.userID)
  // Get: Is this person still active? What's their role?
}

// Step 3: For each log, get transfer details
for (each log) {
  Transfer.findById(log.target.transferID)
  // Get: What transfer was accessed? What data?
}

// Result: Complete audit trail with user/transfer context
// HIPAA compliance proof
```

---

### **Query 3: "Check for drug-allergy conflicts when prescribing"**

```javascript
// Doctor prescribes Amoxicillin to patient allergic to Penicillin

// Step 1: Get patient's allergies from Transfer
Transfer.findOne({
  "patient.patientID": "MRN_12345",
  "transfer.status": "Acknowledged"
}).select("critical.allergies")

// Step 2: Check each allergy against this medication
for (each allergy in critical.allergies) {
  InteractionDatabase.find({
    allergen: allergy,
    medication: "Amoxicillin"
  })
  // Found: CRITICAL conflict!
}

// Step 3: Log the conflict attempt
AuditLog.create({
  action: "Conflict_Detected",
  details: "Attempted to prescribe Amoxicillin to penicillin-allergic patient"
})

// Result: Conflict prevented before prescription
```

---

## Summary: Model Relationships

| Model             | Stores                 | Connects To                       | Purpose                           |
| ----------------- | ---------------------- | --------------------------------- | --------------------------------- |
| **Transfer**      | Main record            | Patient, Hospital, User, AuditLog | Core transfer document            |
| **Patient**       | Demographics + history | Transfer (reverse link)           | Master record + transfer timeline |
| **Hospital**      | Facility info          | Transfer (reverse link)           | Registry of all hospitals         |
| **User**          | Staff info             | Transfer (reverse link)           | Authorization + audit             |
| **InteractionDB** | Drug-allergy conflicts | None (reference by Transfer)      | Safety checking                   |
| **AuditLog**      | Access logs            | Transfer, Patient, User           | Compliance + security             |

---

## Data Flow Summary

```
Doctor fills form
  ↓
Transfer created
  ├→ Check InteractionDatabase (conflicts?)
  ├→ Update/Create Patient (add to history)
  ├→ Verify User permissions (is doctor authorized?)
  ├→ Log to AuditLog (who created it)
  └→ Generate QR code

Patient travels
  ↓
Receiving doctor scans QR
  ├→ Lookup Transfer by token
  ├→ Look up User (who sent it?) + Hospital (from where?)
  ├→ Log to AuditLog (who accessed)
  └→ Show critical info

Doctor marks reviewed
  ├→ Update Transfer (acknowledged)
  ├→ Update Patient (transfer count, last transfer)
  ├→ Log to AuditLog (who reviewed)
  └→ Sync to server (if online)

Later: Patient transferred again
  ├→ Query Patient for transfer history
  ├→ Show: Past transfers + clinical status
  ├→ New doctor continues care
  └→ Log to AuditLog (new access)
```

---

## Key Takeaways

1. **Transfer is the Hub** – Every action revolves around it
2. **Patient tracks history** – Build complete timeline across transfers
3. **Hospital/User are registries** – Quick lookup for contact info & permissions
4. **InteractionDB prevents errors** – Catches conflicts real-time
5. **AuditLog ensures compliance** – Proof of who accessed what, when
6. **Models reference each other** – No data duplication, single source of truth

This architecture enables:

- ✅ Fast form filling (<3 min)
- ✅ Critical info visible in 90 seconds
- ✅ Complete patient history accessible
- ✅ Safety checks (drug-allergy conflicts)
- ✅ HIPAA compliance (full audit trail)
- ✅ Offline-first capability (data stored locally, synced later)
