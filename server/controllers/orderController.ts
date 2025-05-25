import { Request, Response } from 'express';
import Order, { IOrder, IOrderItem, OrderStatus, PayoutStatus, ItemType} from '../models/orderModel';
import Artwork from '../models/artworkModel';
import Course from '../models/courseModel';
import Notification from '../models/notificationModel';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    role: string;
    [key: string]: any;
  };
}

const errorResponse = (res: Response, status: number, message: string, details?: any) => {
  return res.status(status).json({
    success: false,
    error: message,
    ...(details && { details })
  });
};

const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, stripePaymentId, shippingAddress } = req.body;
    const buyerId = req.user?._id;

    if (!buyerId) {
      return errorResponse(res, 401, 'Authentication required');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, 'Order items are required');
    }

    if (!stripePaymentId) {
      return errorResponse(res, 400, 'Stripe payment ID is required');
    }

    const validatedItems: IOrderItem[] = await Promise.all(
      items.map(async (item: { itemType: ItemType; itemId: string }) => {
        if (!item.itemType || !item.itemId) {
          throw new Error('Each item must have itemType and itemId');
        }

        const itemObjectId = new mongoose.Types.ObjectId(item.itemId);
        let product: { _id: mongoose.Types.ObjectId; price: number; title: string } | null;

        if (item.itemType === 'artwork') {
          product = await Artwork.findOne({
            _id: itemObjectId,
            status: 'approved'
          });
        } else if (item.itemType === 'course') {
          product = await Course.findOne({
            _id: itemObjectId,
            status: 'published',
            isApproved: true
          });
        } else {
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
        } as IOrderItem;
      })
    );

    const total = validatedItems.reduce((sum, item) => sum + item.price, 0);

    const order = new Order({
      buyerId,
      items: validatedItems,
      total,
      stripePaymentId,
      shippingAddress,
      status: 'completed' as OrderStatus,
      payoutStatus: 'pending' as PayoutStatus
    });

    await order.save();

    try {
      await handlePostOrderActions(order);
    } catch (postOrderError) {
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

  } catch (error) {
    console.error('Order creation error:', error);
    return errorResponse(res, 500, 'Failed to create order', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const getOrderHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const orders = await Order.find({ buyerId: user._id })
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
  } catch (error) {
    console.error('Order history error:', error);
    return errorResponse(res, 500, 'Failed to fetch order history');
  }
};

const getAllOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return errorResponse(res, 403, 'Admin access required');
    }

    const { status, startDate, endDate, limit = '50', page = '1' } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const limitNum = parseInt(limit as string) || 50;
    const pageNum = parseInt(page as string) || 1;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyerId', 'profile.name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter)
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
  } catch (error) {
    console.error('Get orders error:', error);
    return errorResponse(res, 500, 'Failed to fetch orders');
  }
};

const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return errorResponse(res, 403, 'Admin access required');
    }

    const { status, payoutStatus } = req.body as {
      status?: OrderStatus;
      payoutStatus?: PayoutStatus;
    };

    if (!status && !payoutStatus) {
      return errorResponse(res, 400, 'Either status or payoutStatus must be provided');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    const updates: Partial<IOrder> = {};
    if (status) updates.status = status;
    if (payoutStatus) updates.payoutStatus = payoutStatus;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (status && status !== order.status) {
      try {
        await Notification.create({
          userId: order.buyerId,
          type: 'order_update',
          message: `Your order #${order._id} status changed to ${status}`,
          metadata: { orderId: order._id }
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }
    }

    return res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    return errorResponse(res, 500, 'Failed to update order');
  }
};

const handlePostOrderActions = async (order: IOrder) => {
  await Notification.create({
    userId: order.buyerId,
    type: 'order_confirmation',
    message: `Your order #${order._id} has been confirmed`,
    metadata: { orderId: order._id }
  });

  await Promise.all(
    order.items.map(async (item) => {
      if (item.itemType === 'artwork') {
        await Artwork.findByIdAndUpdate(item.itemId, { 
          status: 'sold',
          soldAt: new Date() 
        });

        const artwork = await Artwork.findById(item.itemId);
        if (artwork) {
          await Notification.create({
            userId: artwork.artistId,
            type: 'artwork_sold',
            message: `Your artwork "${artwork.title}" was purchased for $${item.price}`,
            metadata: { 
              artworkId: artwork._id,
              orderId: order._id 
            }
          });
        }
      } else if (item.itemType === 'course') {
        await Course.findByIdAndUpdate(item.itemId, {
          $addToSet: { students: order.buyerId }
        });

        const course = await Course.findById(item.itemId);
        if (course) {
          await Notification.create({
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
    })
  );
};
module.exports= {
  createOrder,
  getOrderHistory,
  getAllOrders,
  updateOrderStatus
};