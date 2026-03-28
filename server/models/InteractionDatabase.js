const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    allergen: { type: String, required: true },
    medication: { type: String, required: true },

    severity: { type: String, enum: ['Critical', 'Warning', 'Info'], required: true },
    reason: { type: String, required: true },
    recommendation: String,

    category: String, // "Antibiotic", "Analgesic", etc.

    bundleVersion: Number,
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index
interactionSchema.index({ allergen: 1, medication: 1 }, { unique: true });

module.exports = mongoose.model('InteractionDatabase', interactionSchema);
