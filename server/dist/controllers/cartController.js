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
const mongoose_1 = __importDefault(require("mongoose"));
const artworkModel_1 = __importDefault(require("../models/artworkModel"));
const cartModel_1 = __importDefault(require("../models/cartModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const errorResponse = (res, status, message, details) => {
    return res.status(status).json(Object.assign({ success: false, error: message }, (process.env.NODE_ENV === 'development' && { details })));
};
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return errorResponse(res, 401, 'Authentication required');
        // First get unpopulated cart to check raw data
        const rawCart = yield cartModel_1.default.findOne({ userId }).lean();
        if (!rawCart)
            return res.json({ success: true, data: { items: [], total: 0 } });
        // Then get populated cart
        const cart = yield cartModel_1.default.findOne({ userId })
            .populate([
            {
                path: 'items.itemId',
                model: 'Artwork',
                select: 'title price artistId images stock thumbnail status',
                populate: { path: 'artistId', select: 'profile.name profile.avatar' }
            }
        ])
            .lean();
        const validItems = ((cart === null || cart === void 0 ? void 0 : cart.items) || []).filter(item => item.itemId !== null);
        const processedItems = validItems.map(item => {
            var _a, _b;
            const isPopulated = item.itemId && typeof item.itemId === 'object';
            const populatedItem = isPopulated ? item.itemId : null;
            return Object.assign({ _id: item._id, itemType: item.itemType, itemId: isPopulated ? populatedItem._id : item.itemId, title: isPopulated ? populatedItem.title : item.title, price: isPopulated ? populatedItem.price : item.price, quantity: item.quantity, addedAt: item.addedAt }, (item.itemType === 'artwork' && {
                images: isPopulated ? populatedItem.images : item.images || [],
                thumbnail: isPopulated
                    ? populatedItem.thumbnail || ((_b = (_a = populatedItem.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url)
                    : item.thumbnail || '/default-artwork.jpg',
                artist: isPopulated ? populatedItem.artistId : item.artistId
            }));
        });
        const total = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return res.json({
            success: true,
            data: Object.assign(Object.assign({}, cart), { items: processedItems, total }),
            itemCount: processedItems.length
        });
    }
    catch (error) {
        console.error('Error fetching cart:', error);
        return errorResponse(res, 500, 'Failed to fetch cart');
    }
});
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { itemId, quantity = 1 } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        if (!itemId) {
            return errorResponse(res, 400, 'itemId is required');
        }
        if (!mongoose_1.default.isValidObjectId(itemId)) {
            return errorResponse(res, 400, 'Invalid item ID');
        }
        if (quantity < 1) {
            return errorResponse(res, 400, 'Quantity must be at least 1');
        }
        const itemObjectId = new mongoose_1.default.Types.ObjectId(itemId);
        // Determine item type and fetch item
        let itemType = null;
        let item = null;
        // First check if it's an artwork
        item = yield artworkModel_1.default.findOne({
            _id: itemObjectId,
            status: 'approved'
        });
        if (item) {
            itemType = 'artwork';
        }
        else {
            // If not artwork, check if it's a course
            item = yield courseModel_1.default.findOne({
                _id: itemObjectId,
                status: 'published',
                isApproved: true
            });
            if (item) {
                itemType = 'course';
            }
        }
        if (!item || !itemType) {
            // Check if item exists at all
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
        // Stock check for artworks
        if (itemType === 'artwork' && 'stock' in item && item.stock !== undefined && item.stock < quantity) {
            return errorResponse(res, 400, `Only ${item.stock} available in stock`);
        }
        // Get or create cart
        let cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            cart = new cartModel_1.default({ userId, items: [] });
        }
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.itemId.equals(itemObjectId));
        const newCartItem = {
            itemType,
            itemId: item._id,
            price: item.price,
            title: item.title,
            quantity
        };
        if (itemType === 'artwork') {
            const artwork = item;
            newCartItem.images = artwork.images || []; // Use the full images array
        }
        else if (itemType === 'course') {
            const course = item;
        }
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        }
        else {
            // Add new item to cart
            cart.items.push(Object.assign(Object.assign({}, newCartItem), { images: newCartItem.images || [] }));
        }
        yield cart.save();
        return res.status(201).json({
            success: true,
            message: 'Item added to cart successfully',
            data: {
                itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                uniqueItems: cart.items.length,
                total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                item: {
                    id: item._id,
                    title: item.title,
                    type: itemType,
                    price: item.price,
                    quantity: existingItemIndex !== -1 ? cart.items[existingItemIndex].quantity : quantity
                }
            }
        });
    }
    catch (error) {
        console.error('Error adding to cart:', error);
        return errorResponse(res, 500, 'Failed to add item to cart');
    }
});
// Update the updateCartItemQuantity function
const updateCartItemQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Input validation
        if (!userId)
            return errorResponse(res, 401, 'Authentication required');
        if (!cartItemId)
            return errorResponse(res, 400, 'Cart item ID required');
        if (!quantity || quantity < 1)
            return errorResponse(res, 400, 'Valid quantity required');
        if (!mongoose_1.default.isValidObjectId(cartItemId))
            return errorResponse(res, 400, 'Invalid cart item ID');
        // Find the cart
        const cart = yield cartModel_1.default.findOne({ userId });
        if (!cart)
            return errorResponse(res, 404, 'Cart not found');
        // Find the specific cart item
        const cartItem = cart.items.find(item => item._id.toString() === cartItemId);
        if (!cartItem)
            return errorResponse(res, 404, 'Cart item not found');
        // Stock check for artworks
        if (cartItem.itemType === 'artwork') {
            const artwork = yield artworkModel_1.default.findById(cartItem.itemId).select('stock');
            if (artwork && artwork.stock < quantity) {
                return errorResponse(res, 400, `Only ${artwork.stock} available in stock`);
            }
        }
        // Update quantity
        cartItem.quantity = quantity;
        yield cart.save();
        return res.json({
            success: true,
            message: 'Quantity updated successfully',
            data: {
                itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                updatedItem: {
                    _id: cartItem._id,
                    quantity: cartItem.quantity,
                    price: cartItem.price
                }
            }
        });
    }
    catch (error) {
        console.error('Update error:', error);
        return errorResponse(res, 500, 'Failed to update quantity');
    }
});
// Update the removeFromCart function
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { cartItemId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Input validation
        if (!userId)
            return errorResponse(res, 401, 'Authentication required');
        if (!cartItemId)
            return errorResponse(res, 400, 'Cart item ID required');
        if (!mongoose_1.default.isValidObjectId(cartItemId))
            return errorResponse(res, 400, 'Invalid cart item ID');
        // Find and update cart
        const cart = yield cartModel_1.default.findOneAndUpdate({ userId }, { $pull: { items: { _id: new mongoose_1.default.Types.ObjectId(cartItemId) } } }, { new: true });
        if (!cart)
            return errorResponse(res, 404, 'Cart not found');
        return res.json({
            success: true,
            message: 'Item removed successfully',
            data: {
                itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                removedItemId: cartItemId
            }
        });
    }
    catch (error) {
        console.error('Remove error:', error);
        return errorResponse(res, 500, 'Failed to remove item');
    }
});
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        const cart = yield cartModel_1.default.findOneAndUpdate({ userId }, { $set: { items: [] } }, { new: true });
        if (!cart) {
            return errorResponse(res, 404, 'Cart not found');
        }
        return res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                itemCount: 0,
                uniqueItems: 0,
                total: 0
            }
        });
    }
    catch (error) {
        console.error('Error clearing cart:', error);
        return errorResponse(res, 500, 'Failed to clear cart');
    }
});
module.exports = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart
};
