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
exports.getDashboardData = void 0;
const artworkModel_1 = __importDefault(require("../models/artworkModel"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const commisionModel_1 = __importDefault(require("../models/commisionModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const courseModel_1 = __importDefault(require("../models/courseModel"));
const getDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const artistId = user._id;
        const currentYear = new Date().getFullYear();
        const [artworks, orders, commissions, notifications, allNotifications, popularArtworks, courses] = yield Promise.all([
            artworkModel_1.default.find({ artistId }),
            orderModel_1.default.find({
                'items.itemType': 'artwork',
                'items.itemId': { $in: (yield artworkModel_1.default.find({ artistId })).map(a => a._id) }
            }).sort({ createdAt: -1 }).limit(10),
            commisionModel_1.default.find({ artistId })
                .populate('buyerId', 'name email'),
            notificationModel_1.default.find({ userId: artistId, read: false })
                .sort({ createdAt: -1 })
                .limit(5),
            notificationModel_1.default.find({ userId: artistId })
                .sort({ createdAt: -1 }),
            artworkModel_1.default.aggregate([
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
            courseModel_1.default.find({ artistId })
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
        const yearlyOrders = orders.filter(order => new Date(order.createdAt).getFullYear() === currentYear);
        const monthlyEarnings = calculateMonthlyEarnings(yearlyOrders, currentYear);
        // Prepare dashboard data
        const dashboardData = {
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
                    _id: n._id,
                    message: n.message,
                    type: n.type,
                    read: n.read,
                    createdAt: n.createdAt
                }))
            }
        };
        res.json(dashboardData);
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
});
exports.getDashboardData = getDashboardData;
function calculateMonthlyEarnings(orders, year) {
    const monthlyEarnings = {};
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
    getDashboardData: exports.getDashboardData
};
