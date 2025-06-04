import { Request, Response } from 'express';
import User from '../models/userModel';
import Commission from '../models/commisionModel';
import mongoose from 'mongoose';

// Common profile fields for all roles
interface BaseProfileFields {
  name: string;
  email:string;
  bio?: string;
  avatar?: string;
}

// Artist-specific profile fields
interface ArtistProfileFields extends BaseProfileFields {
  portfolio?: string[];
  skills?: string[];
  commissionRates?: {
    kind: string;
    price: number;
    description?: string;
  }[];
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  
}

// Buyer-specific profile fields
interface BuyerProfileFields extends BaseProfileFields {
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

// Get user profile

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get commission stats based on role
    let commissionStats = {};
    if (user.role === 'artist') {
      commissionStats = {
        total: await Commission.countDocuments({ artistId: user._id }),
        completed: await Commission.countDocuments({ 
          artistId: user._id, 
          status: 'completed' 
        }),
        inProgress: await Commission.countDocuments({
          artistId: user._id,
          status: 'accepted'
        })
      };
    } else {
      commissionStats = {
        total: await Commission.countDocuments({ buyerId: user._id }),
        completed: await Commission.countDocuments({ 
          buyerId: user._id, 
          status: 'completed' 
        })
      };
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        profile: {
          name: user.profile.name,
          avatar: user.profile.avatar || null,
          bio: user.profile.bio,
          skills: user.profile.skills,
          portfolio: user.profile.portfolio,
          socialMedia: user.profile.socialMedia,
          commissionRates: user.profile.commissionRates,
          shippingAddress:user.profile.shippingAddress
        },
        role: user.role,
        stripeAccountId: user.stripeAccountId,
        createdAt: user.createdAt,
        commissionStats
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { profile } = req.body; 

    if (!profile) {
      return res.status(400).json({ 
        success: false,
        message: 'Profile data is required',
        code: 'PROFILE_DATA_REQUIRED'
      });
    }

    // Construct the update object with proper dot notation for nested fields
    const updateFields: Record<string, any> = {
      updatedAt: new Date()
    };

    // Add profile fields only if they exist in the request
    if (profile.name) updateFields['profile.name'] = profile.name;
    if (profile.bio) updateFields['profile.bio'] = profile.bio;
    if (profile.avatar) updateFields['profile.avatar'] = profile.avatar;

    // Role-specific updates
    if (req.user?.role === 'artist') {
      if (profile.skills) updateFields['profile.skills'] = profile.skills;
      if (profile.portfolio) updateFields['profile.portfolio'] = profile.portfolio;
      if (profile.commissionRates) updateFields['profile.commissionRates'] = profile.commissionRates;
      if (profile.socialMedia) updateFields['profile.socialMedia'] = profile.socialMedia;
    } else if (req.user?.role === 'buyer') {
      if (profile.shippingAddress) {
        updateFields['profile.shippingAddress'] = {
          ...(profile.shippingAddress || {}),
          ...profile.shippingAddress
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { 
        new: true, 
        runValidators: true,
        select: '-password -oauth' 
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};
// Delete user profile (soft delete)
export const deleteUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    // Instead of actually deleting, we'll mark as inactive
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true }
    ).select('-password -oauth');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User account deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public profile (for other users to view)
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('-password -oauth -stripeAccountId');
    if (!user || (user as any).isActive === false) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return only public information
    const publicProfile = {
      _id: user._id,
      role: user.role,
      email: user.email,
      profile: {
        name: user.profile.name, 
        bio: user.profile.bio,
        avatar: user.profile.avatar
      },
      // Additional role-specific public fields
      ...(user.role === 'artist' && {
        portfolio: (user as any).portfolio || [],
        skills: (user as any).skills || [],
        socialMedia: (user as any).socialMedia || [],
        commissionRates: (user as any).commissionRates || []
      })
    };

    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('Error getting public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile picture only
export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body;
    const userId = req.user?._id;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { 'profile.avatar': avatar, updatedAt: new Date() } },
      { new: true }
    ).select('profile.avatar');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ avatar: updatedUser.profile.avatar });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllArtists = async (req: Request, res: Response) => {
  try {
    const artists = await User.find({ 
      role: 'artist' 
    })
    .select('-password -oauth -stripeAccountId -__v')
    .lean();

    const formattedArtists = artists
      .map(artist => {
        if (!artist._id || !artist.profile || !artist.profile.name) {
          console.warn('Skipping invalid artist record:', artist);
          return null;
        }

        return {
          _id: artist._id.toString(),
          email: artist.email ,
          profile: {
            name: artist.profile.name,
            bio: artist.profile.bio || '',
            avatar: artist.profile.avatar || '/default-avatar.png'
          },
          createdAt: artist.createdAt?.toISOString() || new Date().toISOString()
        };
      })
      .filter(Boolean); 

    return res.status(200).json(formattedArtists);

  } catch (error) {
    console.error('Error in getAllArtists:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch artists',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export const getArtistById = async (req: Request, res: Response) => {
  try {
    const artistId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(artistId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid artist ID',
        code: 'INVALID_ARTIST_ID'
      });
    }

    const artist = await User.findOne({ 
      _id: artistId, 
      role: 'artist', 
      isActive: { $ne: false } 
    }).select('-password -oauth -stripeAccountId');

    if (!artist) {
      return res.status(404).json({ 
        success: false,
        message: 'Artist not found',
        code: 'ARTIST_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: artist._id,
        email: artist.email,
        profile: {
          name: artist.profile.name,
          bio: artist.profile.bio,
          avatar: artist.profile.avatar,
          skills: artist.profile.skills || [],
          portfolio: artist.profile.portfolio || [],
          commissionRates: artist.profile.commissionRates || [],
          socialMedia: artist.profile.socialMedia || []
        },
        createdAt: artist.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching artist by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};


module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getPublicProfile,
  updateProfilePicture,
  getAllArtists,
  getArtistById,
};