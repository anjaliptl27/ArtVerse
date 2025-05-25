"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createCourse, updateCourse, getAllCourses, getCourseById, addLesson, publishCourse, approveCourse, rejectCourse, enrollInCourse, checkEnrollment } = require('../controllers/courseController');
const router = express_1.default.Router();
// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/:courseId/enroll', verifyToken, authorizeRoles('buyer'), enrollInCourse);
router.get('/:id/enrollment', verifyToken, authorizeRoles('buyer'), checkEnrollment);
// Artist routes
router.post('/', verifyToken, authorizeRoles('artist'), createCourse);
router.post('/:id/lessons', verifyToken, authorizeRoles('artist'), addLesson);
router.patch('/:id/publish', verifyToken, authorizeRoles('artist'), publishCourse);
router.put('/:id', verifyToken, authorizeRoles('artist'), updateCourse);
// Admin routes
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), approveCourse);
router.patch('/:id/reject', verifyToken, authorizeRoles('admin'), rejectCourse);
module.exports = router;
