"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createCommission, getCommissions, addMessage, updateCommissionStatus } = require('../controllers/commissionController');
const router = express_1.default.Router();
router.post('/:artistId', verifyToken, authorizeRoles('buyer'), createCommission);
router.get('/', verifyToken, authorizeRoles('buyer', 'artist'), getCommissions);
//Message routes
router.post('/:commissionId/messages', verifyToken, authorizeRoles('buyer', 'artist'), addMessage);
// Artist routes
router.patch('/:commissionId/:status', verifyToken, authorizeRoles('artist'), updateCommissionStatus);
module.exports = router;
