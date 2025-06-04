import { Request, Response } from 'express';
import Artwork, {IArtwork} from '../models/artworkModel';
import Order, {IOrder} from '../models/orderModel';
import Commission, { ICommission } from '../models/commisionModel';
import Notification from '../models/notificationModel';
import Course, { ICourse } from '../models/courseModel';
import { IUser } from '../models/userModel';
import { Types } from 'mongoose';

interface MonthlyEarnings {
  month: string;
  amount: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface PopularArtwork {
  _id: Types.ObjectId;
  title: string;
  sales: number;
}

interface DashboardNotification {
  _id: Types.ObjectId;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}
interface PopulatedBuyer {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

type ICommissionWithBuyer = Omit<ICommission, 'buyerId'> & {
  buyerId: Types.ObjectId | PopulatedBuyer;
};

interface DashboardData {
  sales: {
    totalSales: number;
    monthlyEarnings: MonthlyEarnings[];
  };
  artworks: {
    total: number;
    byStatus: StatusCount[];
    popular: PopularArtwork[];
    all: IArtwork[]; 
  };
  commissions: {
    total: number;
    byStatus: StatusCount[];
    all: ICommissionWithBuyer[]; 
  };
  orders: {
    total: number;
    recent: IOrder[];
  };
  courses: {
    total: number;
    all: ICourse[];
  };
  notifications: {
    unread: number;
    all: DashboardNotification[]; 
  };
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const artistId = user._id;
    const currentYear = new Date().getFullYear();

    const [
      artworks,
      orders,
      commissions,
      notifications,
      allNotifications, 
      popularArtworks,
      courses
    ] = await Promise.all([
      Artwork.find({ artistId }),
      Order.find({ 
        'items.itemType': 'artwork',
        'items.itemId': { $in: (await Artwork.find({ artistId })).map(a => a._id) }
      }).sort({ createdAt: -1 }).limit(10),
      Commission.find({ artistId })
        .populate<{ buyerId: PopulatedBuyer }>('buyerId', 'name email'), 
      Notification.find({ userId: artistId, read: false })
        .sort({ createdAt: -1 })
        .limit(5),
      Notification.find({ userId: artistId }) 
        .sort({ createdAt: -1 }),
      Artwork.aggregate<PopularArtwork>([
        { $match: { artistId } },
        { $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'items.itemId',
            as: 'orders'
          }
        },
        { $project: {
            title: 1,
            sales: { $size: '$orders' }
          }
        },
        { $sort: { sales: -1 } },
        { $limit: 5 }
      ]),
      Course.find({ artistId })
        .populate({
          path: 'lessons',
          select: 'title youtubeUrl duration resources'
        })
        .populate({
          path: 'students.userId',
          select: 'name email profile',
          populate: {
            path: 'profile',
            select: 'name avatar'
          }
        })
    ]);

    // Calculate monthly earnings for current year
    const yearlyOrders = orders.filter(order => 
      new Date(order.createdAt).getFullYear() === currentYear
    );
    const monthlyEarnings = calculateMonthlyEarnings(yearlyOrders, currentYear);

    // Prepare dashboard data
    const dashboardData: DashboardData = {
      sales: {
        totalSales: yearlyOrders.reduce((sum, order) => sum + order.total, 0),
        monthlyEarnings
      },
      artworks: {
        total: artworks.length,
        byStatus: [
          { status: 'approved', count: artworks.filter(a => a.status === 'approved').length },
          { status: 'pending', count: artworks.filter(a => a.status === 'pending').length },
          { status: 'rejected', count: artworks.filter(a => a.status === 'rejected').length }
        ],
        popular: popularArtworks,
        all: artworks
      },
      commissions: {
        total: commissions.length,
        byStatus: [
          { status: 'pending', count: commissions.filter(c => c.status === 'pending').length },
          { status: 'accepted', count: commissions.filter(c => c.status === 'accepted').length },
          { status: 'in_progress', count: commissions.filter(c => c.status === 'in_progress').length },
          { status: 'completed', count: commissions.filter(c => c.status === 'completed').length },
          { status: 'cancelled', count: commissions.filter(c => c.status === 'cancelled').length }
        ],
        all: commissions // Now includes all commissions
      },
      orders: {
        total: orders.length,
        recent: orders.slice(0, 10)
      },
      courses: {
        total: courses.length,
        all: courses
      },
      notifications: {
        unread: notifications.length,
        all: allNotifications.map(n => ({ 
          _id: n._id as Types.ObjectId,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt
        }))
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

function calculateMonthlyEarnings(orders: any[], year: number): MonthlyEarnings[] {
  const monthlyEarnings: { [key: string]: number } = {};
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  months.forEach(month => {
    monthlyEarnings[month] = 0;
  });

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate.getFullYear() === year) {
      const month = months[orderDate.getMonth()];
      monthlyEarnings[month] += order.total;
    }
  });

  return months.map(month => ({
    month,
    amount: monthlyEarnings[month]
  }));
}

module.exports = {
  getDashboardData
};