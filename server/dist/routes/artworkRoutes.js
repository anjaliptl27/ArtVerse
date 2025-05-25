"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createArtwork, getAllArtworks, getArtworkById, updateArtwork, deleteArtwork, approveArtwork, rejectArtwork } = require('../controllers/artworkController');
const router = express_1.default.Router();
router.post('/', verifyToken, authorizeRoles('artist'), createArtwork);
router.get('/', getAllArtworks);
router.get('/:id', getArtworkById);
router.put('/:id', verifyToken, authorizeRoles('artist'), updateArtwork);
router.delete('/:id', verifyToken, authorizeRoles('artist'), deleteArtwork);
//admin routes
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), approveArtwork);
router.patch('/:id/reject', verifyToken, authorizeRoles('admin'), rejectArtwork);
module.exports = router;
