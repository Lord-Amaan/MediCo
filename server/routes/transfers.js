const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Create transfer (requires Create_Transfer permission)
router.post('/', verifyToken, checkPermission('Create_Transfer'), transferController.createTransfer);

// Get all transfers for current hospital
router.get('/', verifyToken, transferController.listTransfers);

// Get transfer report by transferID (public, website use)
router.get('/report/:transferID', transferController.getTransferReportByTransferID);

// Get transfer by QR share token (public, for receiving side)
router.get('/share/:shareToken', transferController.getTransferByShareToken);

// Get patient transfer history
router.get('/patient/:patientID', verifyToken, transferController.getPatientTransferHistory);

// Get transfer by ID
router.get('/:id', verifyToken, transferController.getTransfer);

// Acknowledge transfer (receiving team)
router.post('/:id/acknowledge', verifyToken, checkPermission('Review_Transfer'), transferController.acknowledgeTransfer);

// Mark as transferred
router.put('/:id/transferred', verifyToken, transferController.markTransferred);

// Update transfer
router.put('/:id', verifyToken, transferController.updateTransfer);

// Delete transfer (admin only)
router.delete('/:id', verifyToken, checkPermission('Admin'), transferController.deleteTransfer);

module.exports = router;
