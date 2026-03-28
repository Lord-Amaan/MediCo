const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },

    action: {
      type: String,
      enum: [
        'Transfer_Created',
        'Transfer_Acknowledged',
        'Data_Accessed',
        'Data_Modified',
        'User_Login',
        'User_Logout',
      ],
      required: true,
    },

    actor: {
      userID: String,
      name: String,
      role: String,
      hospital: String,
    },

    target: {
      transferID: mongoose.Schema.Types.ObjectId,
      patientID: String,
      patientName: String,
    },

    details: String,

    // Security info
    ipAddress: String,
    userAgent: String,

    // Sensitive data tracking
    sensitiveDataAccessed: Boolean,
    dataFields: [String],

    deviceInfo: {
      platform: String, // "iOS", "Android", "Web"
      appVersion: String,
      offline: Boolean,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'actor.userID': 1 });
auditLogSchema.index({ 'target.patientID': 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
