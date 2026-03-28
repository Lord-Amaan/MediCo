const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    hospitalID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['PHC', 'CHC', 'District', 'Tertiary'] },
    city: String,
    state: String,

    contact: {
      phone: String,
      email: String,
      emergencyContact: String,
    },

    departments: [
      {
        name: String,
        contactPerson: String,
        phone: String,
      }
    ],

    capabilities: [String], // ["ICU", "Cardiac Care", "Ventilator"]

    apiKey: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },

    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hospitalSchema.index({ hospitalID: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
