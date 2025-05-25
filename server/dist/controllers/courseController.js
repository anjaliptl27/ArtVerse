"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEnrollment = void 0;
const courseModel_1 = __importDefault(require("../models/courseModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
const errorResponse = (res, status, message, details) => {
    return res.status(status).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === 'development' && { details })));
};
// Helper function for thumbnail validation
const isValidThumbnail = (thumbnail) => {
    return thumbnail &&
        typeof thumbnail.url === 'string' &&
        typeof thumbnail.publicId === 'string' &&
        (thumbnail.width === undefined || typeof thumbnail.width === 'number') &&
        (thumbnail.height === undefined || typeof thumbnail.height === 'number');
};
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'artist') {
            return errorResponse(res, 403, 'Only artists can create courses');
        }
        const { title, description, price, thumbnail } = req.body;
        if (!title || !description || !price || !isValidThumbnail(thumbnail)) {
            return errorResponse(res, 400, 'Title, description, price and valid thumbnail are required');
        }
        const priceInCents = Math.round(Number(price) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0 || !Number.isFinite(priceInCents)) {
            return errorResponse(res, 400, 'Invalid price value');
        }
        const course = new courseModel_1.default({
            title,
            description,
            artistId: user._id,
            price: priceInCents,
            thumbnail: Object.assign(Object.assign({ url: thumbnail.url, publicId: thumbnail.publicId }, (thumbnail.width && { width: thumbnail.width })), (thumbnail.height && { height: thumbnail.height })),
            status: 'draft',
            lessons: []
        });
        yield course.save();
        return res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: {
                id: course._id,
                title: course.title,
                status: course.status
            }
        });
    }
    catch (error) {
        console.error('Error creating course:', error);
        return errorResponse(res, 500, 'Failed to create course', error instanceof Error ? error.message : undefined);
    }
});
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!user) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return errorResponse(res, 400, 'Invalid course ID');
        }
        const { title, description, price, thumbnail } = req.body;
        const course = yield courseModel_1.default.findById(req.params.id);
        if (!course) {
            return errorResponse(res, 404, 'Course not found');
        }
        // Authorization check
        if (!course.artistId.equals(user._id)) {
            return errorResponse(res, 403, 'Unauthorized to update this course');
        }
        // Update fields
        if (title)
            course.title = title;
        if (description)
            course.description = description;
        if (price) {
            const priceInCents = Math.round(Number(price) * 100);
            if (isNaN(priceInCents) || priceInCents <= 0 || !Number.isFinite(priceInCents)) {
                return errorResponse(res, 400, 'Invalid price value');
            }
            course.price = priceInCents;
        }
        // Handle thumbnail update if new thumbnail provided
        if (thumbnail) {
            if (!thumbnail.url || !thumbnail.publicId) {
                return errorResponse(res, 400, 'Invalid thumbnail format');
            }
            // Delete old thumbnail from Cloudinary
            if ((_a = course.thumbnail) === null || _a === void 0 ? void 0 : _a.publicId) {
                yield cloudinaryConfig_1.default.uploader.destroy(course.thumbnail.publicId)
                    .catch(err => console.error('Error deleting old thumbnail:', err));
            }
            // Set new thumbnail
            course.thumbnail = Object.assign(Object.assign({ url: thumbnail.url, publicId: thumbnail.publicId }, (thumbnail.width && { width: thumbnail.width })), (thumbnail.height && { height: thumbnail.height }));
        }
        course.status = 'draft';
        course.updatedAt = new Date();
        yield course.save();
        return res.json({
            success: true,
            message: 'Course updated successfully, pending admin approval',
            data: {
                id: course._id,
                title: course.title,
                status: course.status,
                updatedAt: course.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error updating course:', error);
        return errorResponse(res, 500, 'Failed to update course');
    }
});
const getAllCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, minPrice, maxPrice, category, sort = 'newest', page = '1', limit = '20' } = req.query;
        // Build filter
        const filter = {
            status: 'published',
            isApproved: true
        };
        // Text search 
        if (search && typeof search === 'string') {
            filter.$text = { $search: search };
        }
        // Price range filter 
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = Math.round(Number(minPrice) * 100);
            if (maxPrice)
                filter.price.$lte = Math.round(Number(maxPrice) * 100);
        }
        // Category filter
        if (category && typeof category === 'string') {
            filter.category = category;
        }
        // Sorting options
        const sortOptions = {};
        switch (sort) {
            case 'newest':
                sortOptions.createdAt = -1;
                break;
            case 'oldest':
                sortOptions.createdAt = 1;
                break;
            case 'price-high':
                sortOptions.price = -1;
                break;
            case 'price-low':
                sortOptions.price = 1;
                break;
            case 'popular':
                sortOptions.students = -1;
                break;
            case 'rating':
                sortOptions.averageRating = -1;
                break;
            default: sortOptions.createdAt = -1;
        }
        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const skip = (pageNum - 1) * limitNum;
        const [courses, total] = yield Promise.all([
            courseModel_1.default.find(filter)
                .populate('artistId', 'profile.name profile.avatar')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            courseModel_1.default.countDocuments(filter)
        ]);
        return res.json({
            success: true,
            data: courses.map(course => (Object.assign(Object.assign({}, course.toObject()), { price: (course.price / 100).toFixed(2) }))),
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        return errorResponse(res, 500, 'Failed to fetch courses');
    }
});
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return errorResponse(res, 400, 'Invalid course ID');
        }
        const course = yield courseModel_1.default.findOne({
            _id: req.params.id,
            status: 'published',
            isApproved: true
        }).populate('artistId', 'profile.name profile.avatar');
        if (!course) {
            return errorResponse(res, 404, 'Course not found or not approved');
        }
        return res.json({
            success: true,
            data: Object.assign(Object.assign({}, course.toObject()), { price: (course.price / 100).toFixed(2) })
        });
    }
    catch (error) {
        console.error('Error fetching course:', error);
        return errorResponse(res, 500, 'Failed to fetch course');
    }
});
const addLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'artist') {
            return errorResponse(res, 403, 'Only artists can add lessons');
        }
        const { title, youtubeUrl, duration, resources } = req.body;
        if (!title || !youtubeUrl || !duration) {
            return errorResponse(res, 400, 'Title, YouTube URL and duration are required');
        }
        const course = yield courseModel_1.default.findById(req.params.id);
        if (!course) {
            return errorResponse(res, 404, 'Course not found');
        }
        if (!course.artistId.equals(user._id)) {
            return errorResponse(res, 403, 'Unauthorized to modify this course');
        }
        const newLesson = {
            title,
            youtubeUrl,
            duration: Number(duration),
            resources: resources || []
        };
        course.lessons.push(newLesson);
        yield course.save();
        return res.status(201).json({
            success: true,
            message: 'Lesson added successfully',
            data: {
                lessonCount: course.lessons.length,
                lesson: newLesson
            }
        });
    }
    catch (error) {
        console.error('Error adding lesson:', error);
        return errorResponse(res, 500, 'Failed to add lesson');
    }
});
const publishCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'artist') {
            return errorResponse(res, 403, 'Only artists can publish courses');
        }
        const course = yield courseModel_1.default.findById(req.params.id);
        if (!course) {
            return errorResponse(res, 404, 'Course not found');
        }
        if (!course.artistId.equals(user._id)) {
            return errorResponse(res, 403, 'Unauthorized to publish this course');
        }
        if (course.lessons.length === 0) {
            return errorResponse(res, 400, 'Course must have at least one lesson to publish');
        }
        course.status = 'published';
        yield course.save();
        try {
            const admin = yield userModel_1.default.findOne({ role: 'admin' });
            if (admin) {
                yield notificationModel_1.default.create({
                    userId: admin._id,
                    type: 'course_approval',
                    message: `New course "${course.title}" needs approval`,
                    metadata: { courseId: course._id }
                });
            }
        }
        catch (notificationError) {
            console.error('Failed to create admin notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Course published successfully, awaiting admin approval',
            data: {
                id: course._id,
                title: course.title,
                status: course.status,
                isApproved: course.isApproved
            }
        });
    }
    catch (error) {
        console.error('Error publishing course:', error);
        return errorResponse(res, 500, 'Failed to publish course');
    }
});
const approveCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return errorResponse(res, 403, 'Only admins can approve courses');
        }
        const course = yield courseModel_1.default.findById(req.params.id);
        if (!course) {
            return errorResponse(res, 404, 'Course not found');
        }
        if (course.status !== 'published') {
            return errorResponse(res, 400, 'Only published courses can be approved');
        }
        course.isApproved = true;
        yield course.save();
        try {
            yield notificationModel_1.default.create({
                userId: course.artistId,
                type: 'course_approved',
                message: `Your course "${course.title}" has been approved`,
                metadata: { courseId: course._id }
            });
        }
        catch (notificationError) {
            console.error('Failed to create artist notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Course approved successfully',
            data: {
                id: course._id,
                title: course.title,
                status: course.status,
                isApproved: course.isApproved
            }
        });
    }
    catch (error) {
        console.error('Error approving course:', error);
        return errorResponse(res, 500, 'Failed to approve course');
    }
});
const rejectCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return errorResponse(res, 403, 'Only admins can reject courses');
        }
        const { reason } = req.body;
        if (!reason) {
            return errorResponse(res, 400, 'Rejection reason is required');
        }
        const course = yield courseModel_1.default.findById(req.params.id);
        if (!course) {
            return errorResponse(res, 404, 'Course not found');
        }
        course.status = 'rejected';
        course.isApproved = false;
        yield course.save();
        try {
            yield notificationModel_1.default.create({
                userId: course.artistId,
                type: 'course_rejected',
                message: `Your course "${course.title}" was rejected. Reason: ${reason}`,
                metadata: {
                    courseId: course._id,
                    reason
                }
            });
        }
        catch (notificationError) {
            console.error('Failed to create rejection notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Course rejected successfully',
            data: {
                id: course._id,
                title: course.title,
                status: course.status,
                isApproved: course.isApproved
            }
        });
    }
    catch (error) {
        console.error('Error rejecting course:', error);
        return errorResponse(res, 500, 'Failed to reject course');
    }
});
const enrollInCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'buyer') {
            return errorResponse(res, 403, 'Only buyers can enroll in courses');
        }
        if (!mongoose_1.default.isValidObjectId(req.params.courseId)) {
            return errorResponse(res, 400, 'Invalid course ID');
        }
        const course = yield courseModel_1.default.findOne({
            _id: req.params.courseId,
            status: 'published',
            isApproved: true
        });
        if (!course) {
            return errorResponse(res, 404, 'Course not found or not approved');
        }
        // Check if user is already enrolled
        if (course.students.some(studentId => studentId.equals(user._id))) {
            return errorResponse(res, 400, 'You are already enrolled in this course');
        }
        course.students.push(user._id);
        yield course.save();
        // Create enrollment notification for artist
        try {
            yield notificationModel_1.default.create({
                userId: course.artistId,
                type: 'new_enrollment',
                message: `New enrollment in your course "${course.title}"`,
                metadata: {
                    courseId: course._id,
                    studentId: user._id
                }
            });
        }
        catch (notificationError) {
            console.error('Failed to create enrollment notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Enrolled in course successfully',
            data: {
                courseId: course._id,
                title: course.title,
                enrolledAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error enrolling in course:', error);
        return errorResponse(res, 500, 'Failed to enroll in course');
    }
});
const checkEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const courseId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const course = yield courseModel_1.default.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const isEnrolled = course.students.includes(userId);
        res.status(200).json({ success: true, isEnrolled });
    }
    catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.checkEnrollment = checkEnrollment;
module.exports = {
    createCourse,
    updateCourse,
    getAllCourses,
    getCourseById,
    addLesson,
    publishCourse,
    approveCourse,
    rejectCourse,
    enrollInCourse,
    checkEnrollment: exports.checkEnrollment
};
