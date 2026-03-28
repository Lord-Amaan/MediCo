const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    // Patient Info
    patientName: {
      type: String,
      required: true,
    },
    patientAge: {
      type: Number,
    },
    patientID: {
      type: String,
    },

    // Critical Info
    allergies: [String],
    activeMedications: [String],
    transferReason: {
      type: String,
      required: true,
    },

    // Transfer Details
    sendingTeam: {
      type: String,
    },
    receivingTeam: {
      type: String,
    },
    transferDateTime: {
      type: Date,
      default: Date.now,
    },

    // Clinical Notes
    clinicalNotes: String,
    arrivalNote: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'received', 'acknowledged'],
      default: 'pending',
    },

    // QR Code / Share Link
    qrCode: String,
    shareLink: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transfer', transferSchema);
