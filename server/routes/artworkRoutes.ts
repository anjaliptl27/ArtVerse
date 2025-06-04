import express from 'express';
const {verifyToken, authorizeRoles} = require('../middleware/authMiddleware');
const { createArtwork, getAllArtworks, getArtworkById, updateArtwork, deleteArtwork, approveArtwork, rejectArtwork } = require('../controllers/artworkController');

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('artist'), createArtwork);
router.get('/', getAllArtworks);
router.get('/:id', getArtworkById);
router.put('/:id', verifyToken, authorizeRoles('artist'), updateArtwork);
router.delete('/:id', verifyToken, authorizeRoles('artist'), deleteArtwork);

//admin routes
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), approveArtwork);
router.patch('/:id/reject', verifyToken, authorizeRoles('admin'), rejectArtwork);
module.exports=router;