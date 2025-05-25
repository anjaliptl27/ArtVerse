import express from 'express';
import { getDashboardData } from '../controllers/artistDashboardController';
const { verifyToken, authorizeRoles } = require ('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', verifyToken, authorizeRoles('artist'), getDashboardData);

module.exports=router;