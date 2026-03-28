const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    phone: String,

    // Master allergy list
    masterAllergies: [
      {
        name: { type: String, required: true },
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
        status: { type: String, enum: ['Active', 'Stopped', 'Paused'] },
      }
    ],

    // Transfer summary
    totalTransfers: { type: Number, default: 0 },
    lastTransferDate: Date,
    lastTransferFromFacility: String,
    lastTransferToFacility: String,

    // Quick links to transfer records
    transferHistory: [
      {
        transferID: mongoose.Schema.Types.ObjectId,
        date: Date,
        fromFacility: String,
        toFacility: String,
        transferReason: String,
      }
    ],

    // Chronic conditions
    chronicDiagnosis: [String],

    // Data quality tracking
    dataQuality: {
      allergiesVerified: Boolean,
      medicationsVerified: Boolean,
      lastVerificationDate: Date,
    },

    registeredAt: { type: Date, default: Date.now },
    registeredFacility: String,
    updatedAt: Date,
  },
  { timestamps: true }
);

patientSchema.index({ patientID: 1 });
patientSchema.index({ 'transferHistory.transferID': 1 });

module.exports = mongoose.model('Patient', patientSchema);
