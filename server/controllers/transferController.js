const Transfer = require('../models/Transfer');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// ============================================================================
// HELPER: Generate unique transfer ID and share token
// ============================================================================
const generateTransferID = () => `TXF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateShareToken = () => crypto.randomBytes(16).toString('hex');

// ============================================================================
// CREATE TRANSFER
// ============================================================================
exports.createTransfer = async (req, res) => {
  try {
    const { patient, critical, vitals, clinical, receivingFacility } = req.body;

    // Validate required fields
    if (!patient?.name || !patient?.patientID || !patient?.age) {
      return res.status(400).json({ error: 'Patient details (name, ID, age) required' });
    }

    if (!critical?.allergies || !critical?.activeMedications || !critical?.transferReason) {
      return res.status(400).json({ error: 'Critical information required' });
    }

    if (!receivingFacility?.hospitalID) {
      return res.status(400).json({ error: 'Receiving facility required' });
    }

    // Create transfer record
    const transferID = generateTransferID();
    const shareToken = generateShareToken();

    const transfer = new Transfer({
      patient,
      critical,
      vitals: vitals || {},
      clinical: clinical || {},
      sendingFacility: {
        hospitalID: req.user?.hospitalID,
        doctorID: req.user?.userID,
        doctorName: req.user?.name,
        timestamp: new Date(),
      },
      receivingFacility,
      transfer: {
        transferID,
        status: 'Pending',
      },
      sharing: {
        shareToken,
        qrCodeData: JSON.stringify({
          transferID,
          patient,
          critical,
          vitals,
          sendingFacility: receivingFacility,
        }),
      },
      sync: {
        createdLocally: false,
        syncedToServer: true,
        syncedAt: new Date(),
      },
    });

    await transfer.save();

    // Log audit
    await AuditLog.create({
      action: 'Transfer_Created',
      actor: {
        userID: req.user?.userID,
        name: req.user?.name,
        role: req.user?.role,
      },
      target: {
        transferID: transfer._id,
        patientID: patient.patientID,
        patientName: patient.name,
      },
      details: `Transfer created for patient ${patient.name} (ID: ${patient.patientID})`,
      timestamp: new Date(),
    });

    res.status(201).json({
      message: 'Transfer created successfully',
      transfer: {
        _id: transfer._id,
        transferID,
        shareToken,
        patient: transfer.patient,
        critical: transfer.critical,
        sharing: transfer.sharing,
      },
    });
  } catch (error) {
    console.error('❌ Transfer creation error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create transfer' });
  }
};

// ============================================================================
// GET TRANSFER BY ID
// ============================================================================
exports.getTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findOne({
      $or: [{ _id: id }, { 'transfer.transferID': id }],
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET TRANSFER BY QR SHARE TOKEN (Receiving side - QR scan)
// ============================================================================
exports.getTransferByShareToken = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const transfer = await Transfer.findOne({
      'sharing.shareToken': shareToken,
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer record not found or link expired' });
    }

    // Log that this transfer was accessed
    await AuditLog.create({
      action: 'TRANSFER_VIEWED',
      userID: req.user?.userID || 'anonymous',
      targetType: 'Transfer',
      targetID: transfer._id,
      details: { viaShareLink: true },
      timestamp: new Date(),
    });

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LIST TRANSFERS (for user/hospital)
// ============================================================================
exports.listTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientID } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter['transfer.status'] = status; // Pending, Transferred, Received, Acknowledged
    }

    if (patientID) {
      filter['patient.patientID'] = patientID;
    }

    // Filter by user's hospital (sending or receiving)
    filter.$or = [
      { 'sendingFacility.hospitalID': req.user?.hospitalID },
      { 'receivingFacility.hospitalID': req.user?.hospitalID },
    ];

    const transfers = await Transfer.find(filter)
      .select('transfer patient critical sendingFacility receivingFacility acknowledgement')
      .sort({ 'sendingFacility.timestamp': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transfer.countDocuments(filter);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      transfers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// UPDATE TRANSFER (partial update for vitals, clinical notes, etc.)
// ============================================================================
exports.updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { vitals, clinical, transfer: transferUpdate } = req.body;

    const update = {};
    if (vitals) update.vitals = vitals;
    if (clinical) update.clinical = clinical;
    if (transferUpdate) update.transfer = transferUpdate;

    const transfer = await Transfer.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json({
      message: 'Transfer updated successfully',
      transfer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// RECEIVING TEAM ACKNOWLEDGEMENT
// ============================================================================
exports.acknowledgeTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { arrivalNotes, discrepancies, flaggedIssues, immediateActions } = req.body;

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Record acknowledgement
    transfer.acknowledgement = {
      reviewed: true,
      reviewedBy: {
        name: req.user?.name,
        role: req.user?.role,
        timestamp: new Date(),
      },
      arrivalNotes,
      discrepancies: discrepancies || [],
      flaggedIssues: flaggedIssues || [],
      immediateActions: immediateActions || [],
      acknowledgementTime: new Date(),
      synced: true,
      syncedAt: new Date(),
    };

    // Update transfer status
    transfer.transfer.status = 'Received';
    transfer.transfer.actualArrivalTime = new Date();

    await transfer.save();

    // Log audit
    await AuditLog.create({
      action: 'TRANSFER_ACKNOWLEDGED',
      userID: req.user?.userID,
      targetType: 'Transfer',
      targetID: transfer._id,
      details: {
        receivedBy: req.user?.name,
        role: req.user?.role,
        discrepanciesCount: discrepancies?.length || 0,
      },
      timestamp: new Date(),
    });

    res.json({
      message: 'Transfer acknowledged successfully',
      transfer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET PATIENT TRANSFER HISTORY
// ============================================================================
exports.getPatientTransferHistory = async (req, res) => {
  try {
    const { patientID } = req.params;

    const transfers = await Transfer.find({
      'patient.patientID': patientID,
    })
      .select('transfer patient critical sendingFacility receivingFacility acknowledgement')
      .sort({ 'sendingFacility.timestamp': -1 });

    if (transfers.length === 0) {
      return res.json({
        patientID,
        message: 'No transfer history found',
        transfers: [],
      });
    }

    res.json({
      patientID,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// MARK TRANSFER AS TRANSFERRED (Status change)
// ============================================================================
exports.markTransferred = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    transfer.transfer.status = 'Transferred';
    transfer.transfer.startTime = new Date();

    await transfer.save();

    res.json({
      message: 'Transfer marked as transferred',
      transfer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETE TRANSFER (Admin only)
// ============================================================================
exports.deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findByIdAndDelete(id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Log audit
    await AuditLog.create({
      action: 'TRANSFER_DELETED',
      userID: req.user?.userID,
      targetType: 'Transfer',
      targetID: id,
      details: { reason: 'Admin deletion' },
      timestamp: new Date(),
    });

    res.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
