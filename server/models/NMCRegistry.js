const mongoose = require('mongoose');

const nmcRegistrySchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sex: String,
    registrationDate: Date,
    qualifications: [String],
    university: String,
    yearOfPassing: String,
    address: String,
    state: String,
    isVerified: { type: Boolean, default: true }, // All in registry are verified
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index on regNo + name combination
nmcRegistrySchema.index({ regNo: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('NMCRegistry', nmcRegistrySchema);
