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
const mongoose_1 = require("mongoose");
const commisionModel_1 = __importDefault(require("../models/commisionModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const errorResponse = (res, status, message, details) => {
    return res.status(status).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === 'development' && { details })));
};
const createCommission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { artistId } = req.params;
        const { title, description, budget, deadline, sizeRequirements, stylePreferences } = req.body;
        const buyerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!buyerId || !req.user) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!title || !description || !budget) {
            return errorResponse(res, 400, 'Missing required fields');
        }
        // Validate artist exists and is actually an artist
        const artist = yield userModel_1.default.findOne({
            _id: new mongoose_1.Types.ObjectId(artistId),
            role: 'artist'
        });
        if (!artist) {
            return errorResponse(res, 404, 'Artist not found');
        }
        const commission = new commisionModel_1.default({
            buyerId,
            artistId: new mongoose_1.Types.ObjectId(artistId),
            title,
            description,
            budget: Number(budget),
            deadline: deadline ? new Date(deadline) : undefined,
            sizeRequirements,
            stylePreferences,
            messages: [{
                    sender: 'buyer',
                    content: description,
                    sentAt: new Date()
                }]
        });
        yield commission.save();
        // Notify artist
        try {
            yield notificationModel_1.default.create({
                userId: artist._id,
                type: 'new_commission',
                message: `New commission request: ${title}`,
                metadata: {
                    commissionId: commission._id,
                    buyerId: buyerId.toString()
                }
            });
        }
        catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
        }
        return res.status(201).json({
            success: true,
            message: 'Commission request sent successfully',
            data: commission
        });
    }
    catch (error) {
        console.error('Commission creation error:', error);
        return errorResponse(res, 500, 'Failed to create commission request');
    }
});
const getCommissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { role } = req.user || {};
        const { status } = req.query;
        if (!userId || !role) {
            return errorResponse(res, 401, 'Authentication required');
        }
        let query = {};
        if (role === 'artist') {
            query.artistId = userId;
        }
        else if (role === 'buyer') {
            query.buyerId = userId;
        }
        else {
            return errorResponse(res, 403, 'Unauthorized');
        }
        if (status) {
            if (['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
                query.status = status;
            }
            else {
                return errorResponse(res, 400, 'Invalid status value');
            }
        }
        const commissions = yield commisionModel_1.default.find(query)
            .populate('buyerId', 'profile.name profile.avatar')
            .populate('artistId', 'profile.name profile.avatar')
            .sort({ createdAt: -1 });
        return res.json({
            success: true,
            data: commissions
        });
    }
    catch (error) {
        console.error('Get commissions error:', error);
        return errorResponse(res, 500, 'Failed to fetch commissions');
    }
});
const updateCommissionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { commissionId } = req.params;
        const { status } = req.body;
        const artistId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!artistId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'artist') {
            return errorResponse(res, 403, 'Only artists can update commission status');
        }
        if (!['accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
            return errorResponse(res, 400, 'Invalid status value');
        }
        const commission = yield commisionModel_1.default.findOneAndUpdate({
            _id: new mongoose_1.Types.ObjectId(commissionId),
            artistId
        }, { status }, { new: true });
        if (!commission) {
            return errorResponse(res, 404, 'Commission not found or not authorized');
        }
        // Notify buyer
        try {
            yield notificationModel_1.default.create({
                userId: commission.buyerId,
                type: 'commission_update',
                message: `Your commission "${commission.title}" status updated to ${status.replace('_', ' ')}`,
                metadata: { commissionId: commission._id }
            });
        }
        catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Commission status updated',
            data: commission
        });
    }
    catch (error) {
        console.error('Update commission error:', error);
        return errorResponse(res, 500, 'Failed to update commission');
    }
});
const addMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { commissionId } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId || !role || !['artist', 'buyer'].includes(role)) {
            return errorResponse(res, 403, 'Unauthorized');
        }
        if (!content) {
            return errorResponse(res, 400, 'Message content is required');
        }
        const commission = yield commisionModel_1.default.findOne({
            _id: new mongoose_1.Types.ObjectId(commissionId),
            $or: [{ buyerId: userId }, { artistId: userId }]
        });
        if (!commission) {
            return errorResponse(res, 404, 'Commission not found or not authorized');
        }
        const newMessage = {
            sender: role === 'artist' ? 'artist' : 'buyer',
            content,
            //attachments,
            sentAt: new Date()
        };
        commission.messages.push(newMessage);
        yield commission.save();
        // Notify the other party
        const recipientId = role === 'artist' ? commission.buyerId : commission.artistId;
        try {
            yield notificationModel_1.default.create({
                userId: recipientId,
                type: 'commission_message',
                message: `New message on commission: ${commission.title}`,
                metadata: { commissionId: commission._id }
            });
        }
        catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Message added successfully',
            data: {
                message: newMessage,
                commissionId: commission._id
            }
        });
    }
    catch (error) {
        console.error('Add message error:', error);
        return errorResponse(res, 500, 'Failed to add message');
    }
});
module.exports = {
    createCommission,
    getCommissions,
    updateCommissionStatus,
    addMessage
};
