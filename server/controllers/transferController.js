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
    console.log('📨 Incoming request body:', JSON.stringify(req.body, null, 2));
    const { patient, critical, vitals, clinical, receivingFacility, transfer: transferInput } = req.body;

    console.log('📋 Destructured fields:', {
      patient: !!patient,
      critical: !!critical,
      vitals: !!vitals,
      clinical: !!clinical,
      receivingFacility: !!receivingFacility,
      transferInput: !!transferInput
    });

    // Validate required fields
    if (!patient?.name || !patient?.patientID || !patient?.age) {
      console.log('❌ Patient validation failed:', { name: patient?.name, patientID: patient?.patientID, age: patient?.age });
      return res.status(400).json({ error: 'Patient details (name, ID, age) required' });
    }

    // Check critical fields individually
    console.log('🔍 Critical fields check:', {
      allergies: critical?.allergies,
      activeMedications: critical?.activeMedications,
      transferReason: critical?.transferReason
    });

    if (!critical?.allergies || !critical?.activeMedications || !critical?.transferReason) {
      console.log('❌ Critical validation failed');
      return res.status(400).json({ error: 'Critical information required' });
    }

    if (!receivingFacility?.hospitalID) {
      console.log('❌ Receiving facility validation failed');
      return res.status(400).json({ error: 'Receiving facility required' });
    }

    // Validate transfer mode if provided
    const validModes = ['Ambulance', 'Flight', 'Self', 'Other'];
    if (transferInput?.mode && !validModes.includes(transferInput.mode)) {
      console.log('❌ Invalid transfer mode:', transferInput.mode);
      return res.status(400).json({
        error: `Invalid transfer mode: "${transferInput.mode}". Must be one of: ${validModes.join(', ')}`
      });
    }

    // Build patient transfer history context
    console.log('🔐 Fetching previous transfers for patientID:', patient.patientID);
    const previousTransfers = await Transfer.find({
      'patient.patientID': patient.patientID,
    })
      .select('_id createdAt sendingFacility receivingFacility')
      .sort({ createdAt: 1 });

    console.log(`📊 Found ${previousTransfers.length} previous transfers`);

    const patientTransferSequence = previousTransfers.length + 1;

    // Create transfer record
    const transferID = generateTransferID();
    const shareToken = generateShareToken();

    console.log('📋 Creating new Transfer document with transferID:', transferID);

    const transferData = {
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
        mode: transferInput?.mode,
        reason: transferInput?.reason,
        medicalEscort: transferInput?.medicalEscort,
        escort: transferInput?.escort,
        status: 'Pending',
      },
      relatedTransfers: previousTransfers.map((item) => ({
        transferID: item._id,
        date: item.createdAt,
        fromFacility: item.sendingFacility?.hospitalName || item.sendingFacility?.hospitalID || 'Unknown',
        toFacility: item.receivingFacility?.hospitalName || item.receivingFacility?.hospitalID || 'Unknown',
      })),
      patientTransferSequence,
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
    };

    console.log('💾 Transfer data prepared. Saving to database...');
    const transfer = new Transfer(transferData);

    await transfer.save();
    console.log('✅ Transfer saved successfully. TransferID:', transfer._id);

    // Back-link this transfer into older transfer records for bidirectional timeline navigation.
    if (previousTransfers.length > 0) {
      console.log('🔗 Back-linking to', previousTransfers.length, 'previous transfers');
      await Transfer.updateMany(
        { _id: { $in: previousTransfers.map((item) => item._id) } },
        {
          $push: {
            relatedTransfers: {
              transferID: transfer._id,
              date: transfer.createdAt,
              fromFacility: transfer.sendingFacility?.hospitalName || transfer.sendingFacility?.hospitalID || 'Unknown',
              toFacility: transfer.receivingFacility?.hospitalName || transfer.receivingFacility?.hospitalID || 'Unknown',
            },
          },
        }
      );
      console.log('✅ Back-linking completed');
    }

    // Log audit
    console.log('📝 Creating audit log');
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
    console.log('✅ Audit log created');

    console.log('🎉 Transfer creation complete!');
    res.status(201).json({
      message: 'Transfer created successfully',
      transfer: {
        _id: transfer._id,
        transferID,
        patientTransferSequence,
        shareToken,
        patient: transfer.patient,
        critical: transfer.critical,
        sharing: transfer.sharing,
      },
    });
  } catch (error) {
    console.error('❌ Transfer creation error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
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
// GET TRANSFER REPORT BY TRANSFER ID (Public - website use)
// ============================================================================
exports.getTransferReportByTransferID = async (req, res) => {
  try {
    const { transferID } = req.params;

    if (!transferID) {
      return res.status(400).json({ error: 'transferID is required' });
    }

    const transfer = await Transfer.findOne({
      'transfer.transferID': transferID,
    }).select(
      'transfer patient critical vitals clinical sendingFacility receivingFacility acknowledgement interactionCheck patientTransferSequence relatedTransfers createdAt updatedAt'
    );

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer report not found' });
    }

    res.json({
      message: 'Transfer report fetched successfully',
      transfer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch transfer report' });
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
      .select('transfer patient critical sendingFacility receivingFacility acknowledgement patientTransferSequence relatedTransfers')
      .sort({ patientTransferSequence: -1, 'sendingFacility.timestamp': -1 });

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
