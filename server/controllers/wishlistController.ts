import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Artwork from '../models/artworkModel'; 
import Course from '../models/courseModel';
import Wishlist, {IWishlistItem, WishlistItemType } from '../models/wishlistModel';

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

const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const wishlist = await Wishlist.findOne({ userId })
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
      const populatedItem = typeof item.itemId === 'object' ? item.itemId as any : null;
      const baseItem = {
        _id: item._id,
        itemType: item.itemType,
        itemId: populatedItem?._id || item.itemId,
        title: item.title,
        price: item.price,
        addedAt: item.addedAt
      };

      // For artworks, merge stored images with populated data
      if (item.itemType === 'artwork') {
        return {
          ...baseItem,
          artistId: item.artistId,
          images: populatedItem?.images || item.images || [],
        };
      }
      // For courses, use thumbnail
      return {
        ...baseItem,
        thumbnail: item.thumbnail || populatedItem?.thumbnail 
      };
    });

    return res.json({
      success: true,
      data: {
        ...wishlist,
        items: processedItems
      },
      itemCount: wishlist.items.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return errorResponse(res, 500, 'Failed to fetch wishlist', error instanceof Error ? error.message : undefined);
  }
};

const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.body as { itemId: string };
    const userId = req.user?._id;

    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!itemId) {
      return errorResponse(res, 400, 'itemId is required');
    }

    if (!Types.ObjectId.isValid(itemId)) {
      return errorResponse(res, 400, 'Invalid item ID format');
    }

    const itemObjectId = new Types.ObjectId(itemId);

    let itemType: WishlistItemType | null = null;
    let itemDetails: {
      title: string;
      price: number;
      artistId?: Types.ObjectId;
      instructor?: Types.ObjectId;
     thumbnail?: {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
  };
      images?: Array<{
        url: string;
        publicId: string;
        width?: number;
        height?: number;
      }>;
    } | null = null;

    // Check artwork first
    const artwork = await Artwork.findOne({
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
    } else {
      // Check course if not artwork
      const course = await Course.findOne({
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
      const existsAsArtwork = await Artwork.exists({ _id: itemObjectId });
      const existsAsCourse = await Course.exists({ _id: itemObjectId });

      if (existsAsArtwork) {
        return errorResponse(res, 400, 'Artwork is not available (not approved)');
      } else if (existsAsCourse) {
        return errorResponse(res, 400, 'Course is not available (not published or approved)');
      }
      return errorResponse(res, 404, 'Item not found');
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    // Check for duplicates
    const itemExists = wishlist.items.some(
      (wishlistItem: IWishlistItem) => 
        wishlistItem.itemId.equals(itemObjectId)
    );

    if (itemExists) {
      return errorResponse(res, 400, 'Item already in wishlist');
    }

    // Create new wishlist item
    const newItem: IWishlistItem = {
      _id: itemObjectId,
      itemType,
      itemId: itemObjectId,
      title: itemDetails.title,
      price: itemDetails.price,
      addedAt: new Date(),
      ...(itemType === 'artwork' && { 
        artistId: itemDetails.artistId,
        images: itemDetails.images 
      }),
      ...(itemType === 'course' && { 
        thumbnail: itemDetails.thumbnail
      })
    };

    wishlist.items.push(newItem);
    await wishlist.save();

    return res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: {
        wishlistId: wishlist._id,
        item: newItem,
        itemCount: wishlist.items.length
      }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error instanceof mongoose.Error.CastError) {
      return errorResponse(res, 400, 'Invalid ID format');
    }
    return errorResponse(res, 500, 'Failed to add item to wishlist');
  }
};


const clearWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const result = await Wishlist.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { new: true }
    );

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
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return errorResponse(res, 500, 'Failed to clear wishlist');
  }
};

const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wishlistItemId } = req.params; 
    const userId = req.user?._id;

    if (!userId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!wishlistItemId) {
      return errorResponse(res, 400, 'ID is required');
    }

    if (!Types.ObjectId.isValid(wishlistItemId)) {
      return errorResponse(res, 400, 'Invalid ID format');
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return errorResponse(res, 404, 'Wishlist not found');
    }

    const initialLength = wishlist.items.length;
    
    wishlist.items = wishlist.items.filter(
      (item: IWishlistItem) => !item._id.equals(wishlistItemId) && !item.itemId.equals(wishlistItemId)
    );

    if (wishlist.items.length === initialLength) {
      return errorResponse(res, 404, 'Item not found in wishlist');
    }

    await wishlist.save();

    return res.json({
      success: true,
      message: 'Item removed from wishlist successfully',
      data: {
        itemCount: wishlist.items.length
      }
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return errorResponse(res, 500, 'Failed to remove item from wishlist');
  }
};


module.exports= {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};