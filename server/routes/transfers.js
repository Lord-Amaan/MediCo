const express = require('express');
const router = express.Router();
// const { createTransfer, getTransfer, updateTransfer, deleteTransfer } = require('../controllers/transferController');

// TODO: Add routes here
// router.post('/', createTransfer);
// router.get('/:id', getTransfer);
// router.put('/:id', updateTransfer);
// router.delete('/:id', deleteTransfer);

router.get('/', (req, res) => {
  res.json({ message: 'Transfers endpoint ready' });
});

module.exports = router;
