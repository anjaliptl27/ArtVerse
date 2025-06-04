import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Commission, {ICommissionMessage} from '../models/commisionModel';
import User from '../models/userModel';
import Notification from '../models/notificationModel';


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

const createCommission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { artistId } = req.params;
    const { title, description, budget, deadline, sizeRequirements, stylePreferences } = req.body;
    const buyerId = req.user?._id;

    if (!buyerId || !req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!title || !description || !budget) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    // Validate artist exists and is actually an artist
    const artist = await User.findOne({ 
      _id: new Types.ObjectId(artistId),
      role: 'artist' 
    });
    
    if (!artist) {
      return errorResponse(res, 404, 'Artist not found');
    }

    const commission = new Commission({
      buyerId,
      artistId: new Types.ObjectId(artistId),
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

    await commission.save();

    // Notify artist
    try {
      await Notification.create({
        userId: artist._id,
        type: 'new_commission',
        message: `New commission request: ${title}`,
        metadata: { 
          commissionId: commission._id,
          buyerId: buyerId.toString()
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      message: 'Commission request sent successfully',
      data: commission
    });

  } catch (error) {
    console.error('Commission creation error:', error);
    return errorResponse(res, 500, 'Failed to create commission request');
  }
};

const getCommissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { role } = req.user || {};
    const { status } = req.query;

    if (!userId || !role) {
      return errorResponse(res, 401, 'Authentication required');
    }

    let query: any = {};
    
    if (role === 'artist') {
      query.artistId = userId;
    } else if (role === 'buyer') {
      query.buyerId = userId;
    } else {
      return errorResponse(res, 403, 'Unauthorized');
    }

    if (status) {
      if (['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status as string)) {
        query.status = status;
      } else {
        return errorResponse(res, 400, 'Invalid status value');
      }
    }

    const commissions = await Commission.find(query)
      .populate('buyerId', 'profile.name profile.avatar')
      .populate('artistId', 'profile.name profile.avatar')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    return errorResponse(res, 500, 'Failed to fetch commissions');
  }
};

const updateCommissionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commissionId } = req.params;
    const { status } = req.body as { status: string };
    const artistId = req.user?._id;

    if (!artistId || req.user?.role !== 'artist') {
      return errorResponse(res, 403, 'Only artists can update commission status');
    }

    if (!['accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status value');
    }

    const commission = await Commission.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(commissionId),
        artistId 
      },
      { status },
      { new: true }
    );

    if (!commission) {
      return errorResponse(res, 404, 'Commission not found or not authorized');
    }

    // Notify buyer
    try {
      await Notification.create({
        userId: commission.buyerId,
        type: 'commission_update',
        message: `Your commission "${commission.title}" status updated to ${status.replace('_', ' ')}`,
        metadata: { commissionId: commission._id }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return res.json({
      success: true,
      message: 'Commission status updated',
      data: commission
    });
  } catch (error) {
    console.error('Update commission error:', error);
    return errorResponse(res, 500, 'Failed to update commission');
  }
};

const addMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commissionId } = req.params;
    const { content } = req.body as { content: string };
    const userId = req.user?._id;
    const role = req.user?.role;

    if (!userId || !role || !['artist', 'buyer'].includes(role)) {
      return errorResponse(res, 403, 'Unauthorized');
    }

    if (!content) {
      return errorResponse(res, 400, 'Message content is required');
    }

    const commission = await Commission.findOne({
      _id: new Types.ObjectId(commissionId),
      $or: [{ buyerId: userId }, { artistId: userId }]
    });

    if (!commission) {
      return errorResponse(res, 404, 'Commission not found or not authorized');
    }

    const newMessage : ICommissionMessage ={
      sender: role === 'artist' ? 'artist' : 'buyer',
      content,
      //attachments,
      sentAt: new Date()
    };

    commission.messages.push(newMessage);
    await commission.save();

    // Notify the other party
    const recipientId = role === 'artist' ? commission.buyerId : commission.artistId;
    try {
      await Notification.create({
        userId: recipientId,
        type: 'commission_message',
        message: `New message on commission: ${commission.title}`,
        metadata: { commissionId: commission._id }
      });
    } catch (notificationError) {
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
  } catch (error) {
    console.error('Add message error:', error);
    return errorResponse(res, 500, 'Failed to add message');
  }
};

module.exports= {
  createCommission,
  getCommissions,
  updateCommissionStatus,
  addMessage
};