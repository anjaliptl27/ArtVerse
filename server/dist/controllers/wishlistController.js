"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importStar(require("mongoose"));
const artworkModel_1 = __importDefault(require("../models/artworkModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const wishlistModel_1 = __importDefault(require("../models/wishlistModel"));
const errorResponse = (res, status, message, details) => {
    return res.status(status).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === 'development' && { details })));
};
const getWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        const wishlist = yield wishlistModel_1.default.findOne({ userId })
            .populate({
            path: 'items.itemId',
            select: 'title price artistId thumbnail images stats',
            populate: {
                path: 'artistId',
                model: 'User',
                select: 'profile.name profile.avatar'
            }
        })
            .lean();
        if (!wishlist) {
            return res.json({
                success: true,
                data: { items: [], userId: userId.toString() },
                itemCount: 0
            });
        }
        const processedItems = wishlist.items.map(item => {
            const populatedItem = typeof item.itemId === 'object' ? item.itemId : null;
            const baseItem = {
                _id: item._id,
                itemType: item.itemType,
                itemId: (populatedItem === null || populatedItem === void 0 ? void 0 : populatedItem._id) || item.itemId,
                title: item.title,
                price: item.price,
                addedAt: item.addedAt
            };
            // For artworks, merge stored images with populated data
            if (item.itemType === 'artwork') {
                return Object.assign(Object.assign({}, baseItem), { artistId: item.artistId, images: (populatedItem === null || populatedItem === void 0 ? void 0 : populatedItem.images) || item.images || [] });
            }
            // For courses, use thumbnail
            return Object.assign(Object.assign({}, baseItem), { thumbnail: item.thumbnail || (populatedItem === null || populatedItem === void 0 ? void 0 : populatedItem.thumbnail) });
        });
        return res.json({
            success: true,
            data: Object.assign(Object.assign({}, wishlist), { items: processedItems }),
            itemCount: wishlist.items.length
        });
    }
    catch (error) {
        console.error('Error fetching wishlist:', error);
        return errorResponse(res, 500, 'Failed to fetch wishlist', error instanceof Error ? error.message : undefined);
    }
});
const addToWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { itemId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!itemId) {
            return errorResponse(res, 400, 'itemId is required');
        }
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return errorResponse(res, 400, 'Invalid item ID format');
        }
        const itemObjectId = new mongoose_1.Types.ObjectId(itemId);
        let itemType = null;
        let itemDetails = null;
        // Check artwork first
        const artwork = yield artworkModel_1.default.findOne({
            _id: itemObjectId,
            status: 'approved'
        }).select('title price artistId images status');
        if (artwork) {
            itemType = 'artwork';
            itemDetails = {
                title: artwork.title,
                price: artwork.price,
                artistId: artwork.artistId,
                images: artwork.images
            };
        }
        else {
            // Check course if not artwork
            const course = yield courseModel_1.default.findOne({
                _id: itemObjectId,
                status: 'published',
                isApproved: true
            }).select('title price instructor thumbnail status isApproved');
            if (course) {
                itemType = 'course';
                itemDetails = {
                    title: course.title,
                    price: course.price,
                    thumbnail: course.thumbnail
                };
            }
        }
        if (!itemDetails || !itemType) {
            const existsAsArtwork = yield artworkModel_1.default.exists({ _id: itemObjectId });
            const existsAsCourse = yield courseModel_1.default.exists({ _id: itemObjectId });
            if (existsAsArtwork) {
                return errorResponse(res, 400, 'Artwork is not available (not approved)');
            }
            else if (existsAsCourse) {
                return errorResponse(res, 400, 'Course is not available (not published or approved)');
            }
            return errorResponse(res, 404, 'Item not found');
        }
        let wishlist = yield wishlistModel_1.default.findOne({ userId });
        if (!wishlist) {
            wishlist = new wishlistModel_1.default({ userId, items: [] });
        }
        // Check for duplicates
        const itemExists = wishlist.items.some((wishlistItem) => wishlistItem.itemId.equals(itemObjectId));
        if (itemExists) {
            return errorResponse(res, 400, 'Item already in wishlist');
        }
        // Create new wishlist item
        const newItem = Object.assign(Object.assign({ _id: itemObjectId, itemType, itemId: itemObjectId, title: itemDetails.title, price: itemDetails.price, addedAt: new Date() }, (itemType === 'artwork' && {
            artistId: itemDetails.artistId,
            images: itemDetails.images
        })), (itemType === 'course' && {
            thumbnail: itemDetails.thumbnail
        }));
        wishlist.items.push(newItem);
        yield wishlist.save();
        return res.status(201).json({
            success: true,
            message: 'Item added to wishlist successfully',
            data: {
                wishlistId: wishlist._id,
                item: newItem,
                itemCount: wishlist.items.length
            }
        });
    }
    catch (error) {
        console.error('Error adding to wishlist:', error);
        if (error instanceof mongoose_1.default.Error.CastError) {
            return errorResponse(res, 400, 'Invalid ID format');
        }
        return errorResponse(res, 500, 'Failed to add item to wishlist');
    }
});
const clearWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        const result = yield wishlistModel_1.default.findOneAndUpdate({ userId }, { $set: { items: [] } }, { new: true });
        if (!result) {
            return errorResponse(res, 404, 'Wishlist not found');
        }
        return res.json({
            success: true,
            message: 'Wishlist cleared successfully',
            data: {
                itemCount: 0
            }
        });
    }
    catch (error) {
        console.error('Error clearing wishlist:', error);
        return errorResponse(res, 500, 'Failed to clear wishlist');
    }
});
const removeFromWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { wishlistItemId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!wishlistItemId) {
            return errorResponse(res, 400, 'ID is required');
        }
        if (!mongoose_1.Types.ObjectId.isValid(wishlistItemId)) {
            return errorResponse(res, 400, 'Invalid ID format');
        }
        const wishlist = yield wishlistModel_1.default.findOne({ userId });
        if (!wishlist) {
            return errorResponse(res, 404, 'Wishlist not found');
        }
        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter((item) => !item._id.equals(wishlistItemId) && !item.itemId.equals(wishlistItemId));
        if (wishlist.items.length === initialLength) {
            return errorResponse(res, 404, 'Item not found in wishlist');
        }
        yield wishlist.save();
        return res.json({
            success: true,
            message: 'Item removed from wishlist successfully',
            data: {
                itemCount: wishlist.items.length
            }
        });
    }
    catch (error) {
        console.error('Error removing from wishlist:', error);
        return errorResponse(res, 500, 'Failed to remove item from wishlist');
    }
});
module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
};
