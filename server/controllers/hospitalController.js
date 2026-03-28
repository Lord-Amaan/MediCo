const Hospital = require('../models/Hospital');

// ============================================================================
// GET ALL HOSPITALS (with optional filtering)
// ============================================================================
exports.getHospitals = async (req, res) => {
  try {
    const { type, search, state } = req.query;

    // Build filter
    const filter = { isActive: true };

    if (type) {
      filter.type = type; // PHC, CHC, District, Tertiary
    }

    if (state) {
      filter.state = state;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const hospitals = await Hospital.find(filter)
      .select('hospitalID name type city state contact departments capabilities')
      .sort({ name: 1 });

    res.json({
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET SINGLE HOSPITAL
// ============================================================================
exports.getHospital = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findOne({
      $or: [
        { hospitalID: id },
        { _id: id },
      ],
      isActive: true,
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET HOSPITALS BY TYPE (returns only PHC, CHC, District, Tertiary)
// ============================================================================
exports.getHospitalsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const validTypes = ['PHC', 'CHC', 'District', 'Tertiary'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid hospital type' });
    }

    const hospitals = await Hospital.find({
      type,
      isActive: true,
    })
      .select('hospitalID name type city state contact departments')
      .sort({ name: 1 });

    res.json({
      type,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET HOSPITAL TYPES (for UI filter tabs)
// ============================================================================
exports.getHospitalTypes = async (req, res) => {
  try {
    const types = ['PHC', 'CHC', 'District', 'Tertiary'];

    // Get count for each type
    const typeCounts = {};
    for (const type of types) {
      const count = await Hospital.countDocuments({ type, isActive: true });
      typeCounts[type] = count;
    }

    res.json(typeCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
