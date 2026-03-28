const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    // ============================================================================
    // PATIENT IDENTIFIERS
    // ============================================================================
    patient: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other'] },
      patientID: { type: String, required: true, index: true },
      dateOfBirth: Date,
      phone: String,
      address: String,
    },

    // ============================================================================
    // CRITICAL INFORMATION (Shown First)
    // ============================================================================
    critical: {
      allergies: [
        {
          name: { type: String, required: true },
          severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
          reaction: { type: String, required: true },
        }
      ],

      activeMedications: [
        {
          name: { type: String, required: true },
          dose: { type: String, required: true },
          route: { type: String, enum: ['Oral', 'IV', 'Injection', 'Topical', 'Inhaled'], required: true },
          frequency: { type: String, required: true }, // "BID", "TID", "OD"
          indication: String,
          startDate: Date,
          mustNotStop: { type: Boolean, default: false },
        }
      ],

      transferReason: { type: String, required: true },
      primaryDiagnosis: String,
    },

    // ============================================================================
    // VITAL SIGNS & CLINICAL STATUS
    // ============================================================================
    vitals: {
      bloodPressure: String,
      heartRate: Number,
      respiratoryRate: Number,
      temperature: Number,
      oxygenSaturation: Number,
      bloodGlucose: Number,
      recordedAt: Date,
    },

    // ============================================================================
    // CLINICAL INFORMATION
    // ============================================================================
    clinical: {
      recentInvestigations: [
        {
          testName: String,
          result: String,
          findings: String,
          date: Date,
          critical: Boolean,
        }
      ],

      pastMedicalHistory: [String],

      surgicalHistory: [
        {
          procedure: String,
          date: Date,
          outcome: String,
        }
      ],

      clinicalSummary: { type: String, maxlength: 200 },
      clinicalSummaryVoice: { type: Boolean, default: false },
    },

    // ============================================================================
    // SENDING FACILITY / TEAM
    // ============================================================================
    sendingFacility: {
      hospitalName: String,
      hospitalID: String,
      department: String,
      doctorName: String,
      doctorID: String,
      doctorEmail: String, // 📧 Email for sending acknowledgement notifications
      nurseInCharge: String,
      contactPhone: String,
      timestamp: { type: Date, default: Date.now },
    },

    // ============================================================================
    // RECEIVING FACILITY / TEAM
    // ============================================================================
    receivingFacility: {
      hospitalName: String,
      hospitalID: String,
      department: String,
      doctorName: String,
      doctorID: String,
      nurseInCharge: String,
      contactPhone: String,
      estimatedArrivalTime: Date,
    },

    // ============================================================================
    // TRANSFER TRACKING
    // ============================================================================
    transfer: {
      transferID: { type: String, required: true, unique: true, index: true },
      mode: { type: String, enum: ['Ambulance', 'Flight', 'Self', 'Other'] },
      reason: String,
      medicalEscort: Boolean,
      escort: {
        name: String,
        qualification: String,
      },
      startTime: Date,
      estimatedDuration: Number,
      actualArrivalTime: Date,
      status: { type: String, enum: ['Pending', 'Transferred', 'Received', 'Acknowledged'], default: 'Pending', index: true },
    },

    // ============================================================================
    // RECEIVING TEAM ACKNOWLEDGEMENT
    // ============================================================================
    acknowledgement: {
      reviewed: Boolean,
      reviewedBy: {
        name: String,
        role: { type: String, enum: ['Doctor', 'Nurse'] },
        timestamp: Date,
      },

      arrivalNotes: String,

      discrepancies: [
        {
          field: { type: String, enum: ['medication', 'allergy', 'vital'] },
          issue: String,
          action: String,
          timestamp: { type: Date, default: Date.now },
        }
      ],

      flaggedIssues: [String],
      immediateActions: [String],
      acknowledgementTime: Date,
      synced: { type: Boolean, default: false },
      syncedAt: Date,
    },

    // ============================================================================
    // ALLERGY-DRUG INTERACTION CHECKING
    // ============================================================================
    interactionCheck: {
      status: { type: String, enum: ['Checked', 'Pending', 'No Conflicts'], default: 'Pending' },
      conflicts: [
        {
          severity: { type: String, enum: ['Critical', 'Warning', 'Info'] },
          allergen: String,
          medication: String,
          reason: String,
          recommendation: String,
        }
      ],
      checkedAt: Date,
      checkedBy: String,
    },

    // ============================================================================
    // QR CODE & SHAREABLE LINK
    // ============================================================================
    sharing: {
      qrCodeData: String, // Full encoded record for offline
      qrCodeURL: String,
      shareLink: { type: String, index: true },
      shareLinkExpiry: Date,
      shareToken: { type: String, unique: true, sparse: true, index: true },
      readonlyLink: { type: Boolean, default: true },
      linkedRecords: [mongoose.Schema.Types.ObjectId],
    },

    // ============================================================================
    // OFFLINE SYNC METADATA
    // ============================================================================
    sync: {
      createdLocally: Boolean,
      localTimestamp: Date,
      syncedToServer: { type: Boolean, default: false },
      syncedAt: Date,
      syncConflict: Boolean,
      conflictResolution: String,
      lastModified: { type: Date, default: Date.now },
      lastModifiedBy: String,
      version: { type: Number, default: 1 },
    },

    // ============================================================================
    // AUDIT & COMPLIANCE
    // ============================================================================
    audit: {
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
      deleted: { type: Boolean, default: false },
      deletedAt: Date,
      deletionReason: String,
    },

    // ============================================================================
    // PATIENT TRANSFER HISTORY REFERENCE
    // ============================================================================
    relatedTransfers: [
      {
        transferID: mongoose.Schema.Types.ObjectId,
        date: Date,
        fromFacility: String,
        toFacility: String,
      }
    ],

    patientTransferSequence: Number,
  },
  { timestamps: true }
);

// Indexes
transferSchema.index({ 'patient.patientID': 1 });
transferSchema.index({ 'sharing.shareToken': 1 });
transferSchema.index({ 'transfer.transferID': 1 });
transferSchema.index({ 'transfer.status': 1 });
transferSchema.index({ 'sendingFacility.timestamp': -1 });

module.exports = mongoose.model('Transfer', transferSchema);
