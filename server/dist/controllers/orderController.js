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
const orderModel_1 = __importDefault(require("../models/orderModel"));
const artworkModel_1 = __importDefault(require("../models/artworkModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorResponse = (res, status, message, details) => {
    return res.status(status).json(Object.assign({ success: false, error: message }, (details && { details })));
};
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { items, stripePaymentId, shippingAddress } = req.body;
        const buyerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!buyerId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(res, 400, 'Order items are required');
        }
        if (!stripePaymentId) {
            return errorResponse(res, 400, 'Stripe payment ID is required');
        }
        const validatedItems = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            if (!item.itemType || !item.itemId) {
                throw new Error('Each item must have itemType and itemId');
            }
            const itemObjectId = new mongoose_1.default.Types.ObjectId(item.itemId);
            let product;
            if (item.itemType === 'artwork') {
                product = yield artworkModel_1.default.findOne({
                    _id: itemObjectId,
                    status: 'approved'
                });
            }
            else if (item.itemType === 'course') {
                product = yield courseModel_1.default.findOne({
                    _id: itemObjectId,
                    status: 'published',
                    isApproved: true
                });
            }
            else {
                throw new Error(`Invalid item type: ${item.itemType}`);
            }
            if (!product) {
                throw new Error(`${item.itemType} not found or not available: ${item.itemId}`);
            }
            // Return with explicit typing
            return {
                itemType: item.itemType,
                itemId: product._id,
                price: product.price,
                title: product.title
            };
        })));
        const total = validatedItems.reduce((sum, item) => sum + item.price, 0);
        const order = new orderModel_1.default({
            buyerId,
            items: validatedItems,
            total,
            stripePaymentId,
            shippingAddress,
            status: 'completed',
            payoutStatus: 'pending'
        });
        yield order.save();
        try {
            yield handlePostOrderActions(order);
        }
        catch (postOrderError) {
            console.error('Post-order actions failed:', postOrderError);
        }
        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                id: order._id,
                total: order.total,
                itemCount: order.items.length,
                status: order.status
            }
        });
    }
    catch (error) {
        console.error('Order creation error:', error);
        return errorResponse(res, 500, 'Failed to create order', {
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
const getOrderHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return errorResponse(res, 401, 'Authentication required');
        }
        const orders = yield orderModel_1.default.find({ buyerId: user._id })
            .sort({ createdAt: -1 })
            .populate({
            path: 'items.itemId',
            select: 'title thumbnail artistId',
            populate: {
                path: 'artistId',
                select: 'profile.name'
            }
        });
        return res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        console.error('Order history error:', error);
        return errorResponse(res, 500, 'Failed to fetch order history');
    }
});
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return errorResponse(res, 403, 'Admin access required');
        }
        const { status, startDate, endDate, limit = '50', page = '1' } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate)
                filter.createdAt.$gte = new Date(startDate);
            if (endDate)
                filter.createdAt.$lte = new Date(endDate);
        }
        const limitNum = parseInt(limit) || 50;
        const pageNum = parseInt(page) || 1;
        const skip = (pageNum - 1) * limitNum;
        const [orders, total] = yield Promise.all([
            orderModel_1.default.find(filter)
                .populate('buyerId', 'profile.name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            orderModel_1.default.countDocuments(filter)
        ]);
        return res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        return errorResponse(res, 500, 'Failed to fetch orders');
    }
});
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return errorResponse(res, 403, 'Admin access required');
        }
        const { status, payoutStatus } = req.body;
        if (!status && !payoutStatus) {
            return errorResponse(res, 400, 'Either status or payoutStatus must be provided');
        }
        const order = yield orderModel_1.default.findById(req.params.id);
        if (!order) {
            return errorResponse(res, 404, 'Order not found');
        }
        const updates = {};
        if (status)
            updates.status = status;
        if (payoutStatus)
            updates.payoutStatus = payoutStatus;
        const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (status && status !== order.status) {
            try {
                yield notificationModel_1.default.create({
                    userId: order.buyerId,
                    type: 'order_update',
                    message: `Your order #${order._id} status changed to ${status}`,
                    metadata: { orderId: order._id }
                });
            }
            catch (notificationError) {
                console.error('Failed to create notification:', notificationError);
            }
        }
        return res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        console.error('Update order error:', error);
        return errorResponse(res, 500, 'Failed to update order');
    }
});
const handlePostOrderActions = (order) => __awaiter(void 0, void 0, void 0, function* () {
    yield notificationModel_1.default.create({
        userId: order.buyerId,
        type: 'order_confirmation',
        message: `Your order #${order._id} has been confirmed`,
        metadata: { orderId: order._id }
    });
    yield Promise.all(order.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        if (item.itemType === 'artwork') {
            yield artworkModel_1.default.findByIdAndUpdate(item.itemId, {
                status: 'sold',
                soldAt: new Date()
            });
            const artwork = yield artworkModel_1.default.findById(item.itemId);
            if (artwork) {
                yield notificationModel_1.default.create({
                    userId: artwork.artistId,
                    type: 'artwork_sold',
                    message: `Your artwork "${artwork.title}" was purchased for $${item.price}`,
                    metadata: {
                        artworkId: artwork._id,
                        orderId: order._id
                    }
                });
            }
        }
        else if (item.itemType === 'course') {
            yield courseModel_1.default.findByIdAndUpdate(item.itemId, {
                $addToSet: { students: order.buyerId }
            });
            const course = yield courseModel_1.default.findById(item.itemId);
            if (course) {
                yield notificationModel_1.default.create({
                    userId: course.artistId,
                    type: 'course_enrollment',
                    message: `New student enrolled in your course "${course.title}" for $${item.price}`,
                    metadata: {
                        courseId: course._id,
                        studentId: order.buyerId
                    }
                });
            }
        }
    })));
});
module.exports = {
    createOrder,
    getOrderHistory,
    getAllOrders,
    updateOrderStatus
};
