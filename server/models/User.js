const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: String,

    hospital: {
      hospitalID: mongoose.Schema.Types.ObjectId,
      hospitalName: String,
      department: String,
    },

    role: { type: String, enum: ['Doctor', 'Nurse', 'Admin'], required: true },
    qualifications: [String],

  // NMC Verification
  registrationNumber: String, // Doctor's NMC Reg No
  isNMCVerified: { type: Boolean, default: false },
  nmcVerificationDate: Date,


    // Authentication
    passwordHash: String,
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,

    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ userID: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'hospital.hospitalID': 1 });

module.exports = mongoose.model('User', userSchema);
