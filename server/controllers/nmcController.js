const NMCRegistry = require('../models/NMCRegistry');

// Verify doctor credentials against NMC registry
const verifyDoctorCredentials = async (req, res) => {
  try {
    const { regNo, name } = req.body;

    if (!regNo || !name) {
      return res.status(400).json({
        success: false,
        error: 'Registration Number and Name are required',
      });
    }

    // Search for matching record in NMC registry (case-insensitive)
    const registryRecord = await NMCRegistry.findOne({
      regNo: regNo.trim().toUpperCase(),
      name: { $regex: name.trim(), $options: 'i' }, // Case-insensitive name search
    });

    if (registryRecord) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Doctor credentials verified successfully',
        data: {
          regNo: registryRecord.regNo,
          name: registryRecord.name,
          qualifications: registryRecord.qualifications,
          yearOfPassing: registryRecord.yearOfPassing,
          registrationDate: registryRecord.registrationDate,
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Doctor credentials not found in NMC registry. Please verify Reg No and Name.',
      });
    }
  } catch (error) {
    console.error('NMC Verification Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to verify credentials. Please try again.',
    });
  }
};

// Get verification status for a doctor
const getVerificationStatus = async (req, res) => {
  try {
    const { regNo } = req.params;

    if (!regNo) {
      return res.status(400).json({
        success: false,
        error: 'Registration Number is required',
      });
    }

    const registryRecord = await NMCRegistry.findOne({
      regNo: regNo.trim().toUpperCase(),
    });

    return res.status(200).json({
      success: true,
      verified: !!registryRecord,
      data: registryRecord || null,
    });
  } catch (error) {
    console.error('Verification Status Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to fetch verification status',
    });
  }
};

module.exports = {
  verifyDoctorCredentials,
  getVerificationStatus,
};
