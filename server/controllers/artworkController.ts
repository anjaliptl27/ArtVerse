import { Request, Response } from 'express';
import Artwork from '../models/artworkModel';
import Notification from '../models/notificationModel';
import User from '../models/userModel';
import cloudinary from '../config/cloudinaryConfig';
import { Types } from 'mongoose';

type ArtworkStatus = 'pending' | 'approved' | 'rejected';
type RejectionReason = 'low_quality' | 'copyright_issues' | 'inappropriate_content' | 'other' | null;

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      _id: Types.ObjectId;
      role: string;
      [key: string]: any;
    };
  }
}

interface IArtworkImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface IArtworkQuery {
  status?: ArtworkStatus;
  artistId?: Types.ObjectId;
  category?: string;
  price?: {
    $gte?: number;
    $lte?: number;
  };
  $text?: { $search: string };
}

const errorResponse = (res: Response, status: number, message: string, details?: any) => {
  return res.status(status).json({ 
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details }) 
  });
};

// Create artwork - artist only
const createArtwork = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'artist') {
      return errorResponse(res, 403, 'Only artists can create artworks');
    }

    const { title, description, category, price, stock, tags, images } = req.body;
    const artistId = user._id;

    // Validate required fields
   if (!title || !description || !category || !price || !stock || !images || images.length === 0) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    // Validate price and stock
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    if (isNaN(priceNum)) {
      return errorResponse(res, 400, 'Price must be a valid number');
    }
    if (isNaN(stockNum)) {
      return errorResponse(res, 400, 'Stock must be a valid integer');
    }

    // Validate images array structure
    if (!Array.isArray(images) || images.some(img => !img.url || !img.publicId)) {
      return errorResponse(res, 400, 'Invalid images format');
    }

    // Create new artwork
    const artwork = new Artwork({
      title,
      description,
      artistId,
      category,
      price: priceNum,
      stock: stockNum,
      images: images.map((img: IArtworkImage) => ({
        url: img.url,
        publicId: img.publicId,
        width: img.width,
        height: img.height
      })),
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      status: 'pending'
    });

 

    await artwork.save();

    // Notify admin
    try {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await Notification.create({
          userId: adminUser._id,
          type: 'approval',
          message: `New artwork "${artwork.title}" submitted for approval`,
          metadata: { artworkId: artwork._id },
          read: false
        });
      }
    } catch (notificationError) {
      console.error('Failed to create admin notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      message: 'Artwork created successfully, pending admin approval',
      data: {
        id: artwork._id,
        title: artwork.title,
        status: artwork.status,
        createdAt: artwork.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating artwork:', error);
    return errorResponse(res, 500, 'Failed to create artwork');
  }
};

//get all artworks
const getAllArtworks = async (req: Request, res: Response) => {
  try {
    const { 
      status = 'approved', 
      artistId, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      sort = 'newest',
      limit = '20',
      page = '1',
    } = req.query;

    // Build filter
    const user = req.user;
    const filter: IArtworkQuery = {};
    
    // Status filter with authorization
    if (status !== 'approved' && user) {
      if (user.role === 'admin' || (user.role === 'artist' && artistId === user._id.toString())) {
        filter.status = status as ArtworkStatus;
      }
    } else {
      filter.status = 'approved';
    }

    // Artist filter
    if (artistId && Types.ObjectId.isValid(artistId as string)) {
      filter.artistId = new Types.ObjectId(artistId as string);
    }
    
    // Category filter
    if (category) {
      filter.category = category as string;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search (ensure you have a text index on title and description)
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Enhanced sorting options
    const sortOptions: Record<string, any> = {};
    switch (sort) {
      case 'newest': sortOptions.createdAt = -1; break;
      case 'oldest': sortOptions.createdAt = 1; break;
      case 'price-high': sortOptions.price = -1; break;
      case 'price-low': sortOptions.price = 1; break;
      case 'popular': sortOptions['stats.views'] = -1; break;
      case 'likes': sortOptions['stats.likes'] = -1; break;
      case 'title-asc': sortOptions.title = 1; break;
      case 'title-desc': sortOptions.title = -1; break;
      default: sortOptions.createdAt = -1;
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const pageNum = parseInt(page as string) || 1;
    const skip = (pageNum - 1) * limitNum;

    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('artistId', 'profile.name profile.avatar'),
      Artwork.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: artworks,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching artworks:', error);
    return errorResponse(res, 500, 'Failed to fetch artworks');
  }
};

// Get Artwork by Id
const getArtworkById = async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid artwork ID');
    }

    const artwork = await Artwork.findOne({ 
      _id: req.params.id
    }).populate('artistId', 'profile.name profile.avatar');

    if (!artwork) {
      return errorResponse(res, 404, 'Artwork not found');
    }

    // Check if user can see non-approved artwork
    const user = req.user;
    if (artwork.status !== 'approved') {
      if (!user || (!user._id.equals(artwork.artistId) && user.role !== 'admin')) {
        return errorResponse(res, 403, 'This artwork is not publicly available');
      }
    }

    // Initialize stats if not present
    if (!artwork.stats) {
      artwork.stats = { views: 0, likes: 0 };
    }
    
    // Increment view count
    artwork.stats.views += 1;
    await artwork.save();

    return res.json({
      success: true,
      data: artwork
    });

  } catch (error) {
    console.error('Error fetching artwork:', error);
    return errorResponse(res, 500, 'Failed to fetch artwork');
  }
};

// Delete artwork - artist or admin only
const deleteArtwork = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid artwork ID');
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return errorResponse(res, 404, 'Artwork not found');
    }

    // Authorization check
    const isArtist = artwork.artistId.equals(user._id);
    const isAdmin = user.role === 'admin';
    if (!isArtist && !isAdmin) {
      return errorResponse(res, 403, 'Unauthorized to delete this artwork');
    }

    // Delete image from Cloudinary
    if (artwork.images?.length) {
      await Promise.all(
        artwork.images.map(image => 
          cloudinary.uploader.destroy(image.publicId)
            .catch(err => console.error('Error deleting image:', err))
        )
      );
    }

    await artwork.deleteOne();

    return res.json({
      success: true,
      message: 'Artwork deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting artwork:', error);
    return errorResponse(res, 500, 'Failed to delete artwork');
  }
};

// Update artwork details - artist only
const updateArtwork = async (req: Request, res: Response) => {
  try {
   
    const user = req.user;
    if (!user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid artwork ID');
    }

    const { title, description, category, price, stock, tags, images } = req.body;
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return errorResponse(res, 404, 'Artwork not found');
    }

    // Authorization check
    if (!artwork.artistId.equals(user._id)) {
      return errorResponse(res, 403, 'Unauthorized to update this artwork');
    }

    // Update fields
    if (title) artwork.title = title;
    if (description) artwork.description = description;
    if (category) artwork.category = category;
    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        return errorResponse(res, 400, 'Invalid price format');
      }
      artwork.price = priceNum;
    }
    if (stock) {
      const stockNum = parseInt(stock);
      if (isNaN(stockNum)) {
        return errorResponse(res, 400, 'Invalid stock format');
      }
      artwork.stock = stockNum;
    }
    if (tags) artwork.tags = tags.split(',').map((tag: string) => tag.trim());

    // Handle image updates if new images provided
    if (images && Array.isArray(images) && images.length > 0) {
      // First validate the new images
      if (images.some(img => !img.url || !img.publicId)) {
        return errorResponse(res, 400, 'Invalid images format');
      }

      // Delete old images from Cloudinary
      if (artwork.images?.length) {
        await Promise.all(
          artwork.images.map(image => 
            cloudinary.uploader.destroy(image.publicId)
              .catch(err => console.error('Error deleting old image:', err))
          )
        );
      }
      
      // Set new images
      artwork.images = images.map(img => ({
        url: img.url,
        publicId: img.publicId,
        width: img.width,
        height: img.height
      }));
    }

    artwork.status = 'pending'; // Requires re-approval
    artwork.updatedAt = new Date();
    await artwork.save();

    return res.json({
      success: true,
      message: 'Artwork updated successfully, pending admin approval',
      data: {
        id: artwork._id,
        title: artwork.title,
        status: artwork.status,
        updatedAt: artwork.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating artwork:', error);
    return errorResponse(res, 500, 'Failed to update artwork');
  }
};

// Approve artwork - admin only
const approveArtwork = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return errorResponse(res, 403, 'Only admins can approve artworks');
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid artwork ID');
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return errorResponse(res, 404, 'Artwork not found');
    }

    // Update status
    artwork.status = 'approved';
    artwork.approvedAt = new Date();
    artwork.rejectionReason = null;
    await artwork.save();

    // Notify artist
    try {
      await Notification.create({
        userId: artwork.artistId,
        type: 'approval',
        message: `Your artwork "${artwork.title}" has been approved`,
        metadata: { artworkId: artwork._id },
        read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return res.json({
      success: true,
      message: 'Artwork approved successfully',
      data: {
        id: artwork._id,
        title: artwork.title,
        status: artwork.status
      }
    });

  } catch (error) {
    console.error('Error approving artwork:', error);
    return errorResponse(res, 500, 'Failed to approve artwork');
  }
};

// Reject artwork - admin only
const rejectArtwork = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== 'admin') {
      return errorResponse(res, 403, 'Only admins can reject artworks');
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid artwork ID');
    }

    const { reason } = req.body as { reason: RejectionReason };
    
    // Validate rejection reason
    const validReasons: RejectionReason[] = [
      'low_quality',
      'copyright_issues',
      'inappropriate_content',
      'other',
      null
    ];

    if (reason && !validReasons.includes(reason)) {
      return errorResponse(res, 400, 'Invalid rejection reason');
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return errorResponse(res, 404, 'Artwork not found');
    }

    // Update status
    artwork.status = 'rejected';
    artwork.rejectionReason = reason;
    await artwork.save();

    // Notify artist
    try {
      await Notification.create({
        userId: artwork.artistId,
        type: 'system',
        message: `Your artwork "${artwork.title}" was rejected${reason ? `: ${reason}` : ''}`,
        metadata: { artworkId: artwork._id },
        read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return res.json({
      success: true,
      message: 'Artwork rejected successfully',
      data: {
        id: artwork._id,
        title: artwork.title,
        status: artwork.status,
        rejectionReason: artwork.rejectionReason
      }
    });

  } catch (error) {
    console.error('Error rejecting artwork:', error);
    return errorResponse(res, 500, 'Failed to reject artwork');
  }
};

module.exports= {
  createArtwork,
  getAllArtworks,
  getArtworkById,
  deleteArtwork,
  updateArtwork,
  approveArtwork,
  rejectArtwork
};