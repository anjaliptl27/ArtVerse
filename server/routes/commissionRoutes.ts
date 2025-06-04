import express from 'express';
const { verifyToken, authorizeRoles } = require ('../middleware/authMiddleware');
const { createCommission, getCommissions, addMessage, updateCommissionStatus } = require( '../controllers/commissionController');

const router = express.Router();

router.post('/:artistId', verifyToken, authorizeRoles('buyer'),  createCommission);
router.get('/', verifyToken, authorizeRoles('buyer', 'artist'), getCommissions);

//Message routes
router.post('/:commissionId/messages', verifyToken, authorizeRoles('buyer', 'artist'), addMessage);

// Artist routes
router.patch('/:commissionId/:status', verifyToken, authorizeRoles('artist'), updateCommissionStatus);

module.exports=router;