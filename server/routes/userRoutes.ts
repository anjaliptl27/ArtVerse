import express from 'express';
const { verifyToken} = require( '../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getPublicProfile,
  updateProfilePicture,
  getAllArtists,
  getArtistById
} = require('../controllers/userController');

const router = express.Router();

// Authenticated routes
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.delete('/profile', verifyToken, deleteUserProfile);
router.put('/profile/picture', verifyToken, updateProfilePicture);

//artist routes
router.get('/artists', getAllArtists);
router.get('/artists/:id', getArtistById);

// Public route
router.get('/:userId', getPublicProfile);

module.exports = router;