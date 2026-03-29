const express = require('express');
const { verifyDoctorCredentials, getVerificationStatus } = require('../controllers/nmcController');

const router = express.Router();

// POST /api/nmc/verify - Verify doctor by Reg No and Name
router.post('/verify', verifyDoctorCredentials);

// GET /api/nmc/verify/:regNo - Get verification status by Reg No
router.get('/verify/:regNo', getVerificationStatus);

module.exports = router;
