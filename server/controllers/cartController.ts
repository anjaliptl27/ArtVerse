import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Artwork, {IArtwork} from '../models/artworkModel'; 
import { ICourse } from '../models/courseModel';
import Cart, {ICartItem, CartItemType} from '../models/cartModel';
import Course from '../models/courseModel';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    [key: string]: any;
    role: string;
  };
}

const errorResponse = (res: Response, status: number, message: string, details?: any) => {
  return res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details })
  });
};

const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return errorResponse(res, 401, 'Authentication required');

    // First get unpopulated cart to check raw data
    const rawCart = await Cart.findOne({ userId }).lean();
    if (!rawCart) return res.json({ success: true, data: { items: [], total: 0 } });

    // Then get populated cart
    const cart = await Cart.findOne({ userId })
      .populate([
        {
          path: 'items.itemId',
          model: 'Artwork',
          select: 'title price artistId images stock thumbnail status',
          populate: { path: 'artistId', select: 'profile.name profile.avatar' }
        }
      ])
      .lean();

    const validItems = (cart?.items || []).filter(item => item.itemId !== null);

    const processedItems = validItems.map(item => {
      const isPopulated = item.itemId && typeof item.itemId === 'object';
      const populatedItem = isPopulated ? item.itemId as any : null;

      return {
        _id: item._id,
        itemType: item.itemType,
        itemId: isPopulated ? populatedItem._id : item.itemId,
        title: isPopulated ? populatedItem.title : item.title,
        price: isPopulated ? populatedItem.price : item.price,
        quantity: item.quantity,
        addedAt: item.addedAt,
        // Artwork specific fields
        ...(item.itemType === 'artwork' && {
          images: isPopulated ? populatedItem.images : item.images || [],
          thumbnail: isPopulated 
            ? populatedItem.thumbnail || populatedItem.images?.[0]?.url 
            : item.thumbnail || '/default-artwork.jpg',
          artist: isPopulated ? populatedItem.artistId : item.artistId
        })
      };
    });

    const total = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.json({
      success: true,
      data: {
        ...cart,
        items: processedItems,
        total
      },
      itemCount: processedItems.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return errorResponse(res, 500, 'Failed to fetch cart');
  }
};

const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, quantity = 1 } = req.body as { 
      itemId: string;
      quantity?: number;
    };
    const userId = req.user?._id;

    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!itemId) {
      return errorResponse(res, 400, 'itemId is required');
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return errorResponse(res, 400, 'Invalid item ID');
    }

    if (quantity < 1) {
      return errorResponse(res, 400, 'Quantity must be at least 1');
    }

    const itemObjectId = new mongoose.Types.ObjectId(itemId);
    
    // Determine item type and fetch item
    let itemType: CartItemType | null = null;
    let item: (IArtwork & { _id: mongoose.Types.ObjectId }) | (ICourse & { _id: mongoose.Types.ObjectId }) | null = null;

    // First check if it's an artwork
    item = await Artwork.findOne({
      _id: itemObjectId,
      status: 'approved'
    });

    if (item) {
      itemType = 'artwork';
    } else {
      // If not artwork, check if it's a course
      item = await Course.findOne({
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
      const existsAsArtwork = await Artwork.exists({ _id: itemObjectId });
      const existsAsCourse = await Course.exists({ _id: itemObjectId });

      if (existsAsArtwork) {
        return errorResponse(res, 400, 'Artwork is not available (not approved)');
      } else if (existsAsCourse) {
        return errorResponse(res, 400, 'Course is not available (not published or approved)');
      }
      return errorResponse(res, 404, 'Item not found');
    }

    // Stock check for artworks
    if (itemType === 'artwork' && 'stock' in item && item.stock !== undefined && item.stock < quantity) {
      return errorResponse(res, 400, `Only ${item.stock} available in stock`);
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (cartItem: ICartItem) => cartItem.itemId.equals(itemObjectId)
    );

    const newCartItem: Partial<ICartItem> = {
      itemType,
      itemId: item._id,
      price: item.price,
      title: item.title,
      quantity
    };

if (itemType === 'artwork') {
      const artwork = item as IArtwork & { _id: mongoose.Types.ObjectId };
      newCartItem.images = artwork.images || []; // Use the full images array
    } else if (itemType === 'course') {
      const course = item as ICourse & { _id: mongoose.Types.ObjectId };
    }

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        ...newCartItem,
       images: newCartItem.images || [],
      }as ICartItem);
    }

    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        itemCount: cart.items.reduce((sum: number, item: ICartItem) => sum + item.quantity, 0),
        uniqueItems: cart.items.length,
        total: cart.items.reduce((sum: number, item: ICartItem) => sum + (item.price * item.quantity), 0),
        item: {
          id: item._id,
          title: item.title,
          type: itemType,
          price: item.price,
          quantity: existingItemIndex !== -1 ? cart.items[existingItemIndex].quantity : quantity
        }
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return errorResponse(res, 500, 'Failed to add item to cart');
  }
};

// Update the updateCartItemQuantity function
const updateCartItemQuantity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cartItemId } = req.params; 
    const { quantity } = req.body;
    const userId = req.user?._id;

    // Input validation
    if (!userId) return errorResponse(res, 401, 'Authentication required');
    if (!cartItemId) return errorResponse(res, 400, 'Cart item ID required');
    if (!quantity || quantity < 1) return errorResponse(res, 400, 'Valid quantity required');
    if (!mongoose.isValidObjectId(cartItemId)) return errorResponse(res, 400, 'Invalid cart item ID');

    // Find the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) return errorResponse(res, 404, 'Cart not found');

    // Find the specific cart item
    const cartItem = cart.items.find(item => item._id.toString() === cartItemId);
    if (!cartItem) return errorResponse(res, 404, 'Cart item not found');

    // Stock check for artworks
    if (cartItem.itemType === 'artwork') {
      const artwork = await Artwork.findById(cartItem.itemId).select('stock');
      if (artwork && artwork.stock < quantity) {
        return errorResponse(res, 400, `Only ${artwork.stock} available in stock`);
      }
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cart.save();

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
  } catch (error) {
    console.error('Update error:', error);
    return errorResponse(res, 500, 'Failed to update quantity');
  }
};

// Update the removeFromCart function
const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cartItemId } = req.params; 
    const userId = req.user?._id;

    // Input validation
    if (!userId) return errorResponse(res, 401, 'Authentication required');
    if (!cartItemId) return errorResponse(res, 400, 'Cart item ID required');
    if (!mongoose.isValidObjectId(cartItemId)) return errorResponse(res, 400, 'Invalid cart item ID');

    // Find and update cart
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: new mongoose.Types.ObjectId(cartItemId) } } },
      { new: true }
    );

    if (!cart) return errorResponse(res, 404, 'Cart not found');

    return res.json({
      success: true,
      message: 'Item removed successfully',
      data: {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        removedItemId: cartItemId
      }
    });
  } catch (error) {
    console.error('Remove error:', error);
    return errorResponse(res, 500, 'Failed to remove item');
  }
};

const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { new: true }
    );

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
  } catch (error) {
    console.error('Error clearing cart:', error);
    return errorResponse(res, 500, 'Failed to clear cart');
  }
};

module.exports= {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart
};
