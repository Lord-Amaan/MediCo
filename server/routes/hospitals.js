const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

// Get all hospitals with optional filtering
router.get('/', hospitalController.getHospitals);

// Get hospital types and counts
router.get('/types', hospitalController.getHospitalTypes);

// Get hospitals by specific type
router.get('/type/:type', hospitalController.getHospitalsByType);

// Get single hospital
router.get('/:id', hospitalController.getHospital);

module.exports = router;
