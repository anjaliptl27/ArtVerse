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
exports.getArtistById = exports.getAllArtists = exports.updateProfilePicture = exports.getPublicProfile = exports.deleteUserProfile = exports.updateUserProfile = exports.getUserProfile = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const commisionModel_1 = __importDefault(require("../models/commisionModel"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get user profile
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield userModel_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select('-password');
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
                total: yield commisionModel_1.default.countDocuments({ artistId: user._id }),
                completed: yield commisionModel_1.default.countDocuments({
                    artistId: user._id,
                    status: 'completed'
                }),
                inProgress: yield commisionModel_1.default.countDocuments({
                    artistId: user._id,
                    status: 'accepted'
                })
            };
        }
        else {
            commissionStats = {
                total: yield commisionModel_1.default.countDocuments({ buyerId: user._id }),
                completed: yield commisionModel_1.default.countDocuments({
                    buyerId: user._id,
                    status: 'completed'
                })
            };
        }
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                profile: {
                    name: user.profile.name,
                    email: user.email,
                    avatar: user.profile.avatar || null,
                    bio: user.profile.bio,
                    skills: user.profile.skills,
                    portfolio: user.profile.portfolio,
                    socialMedia: user.profile.socialMedia,
                    commissionRates: user.profile.commissionRates,
                    shippingAddress: user.profile.shippingAddress
                },
                role: user.role,
                stripeAccountId: user.stripeAccountId,
                createdAt: user.createdAt,
                commissionStats
            }
        });
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});
exports.getUserProfile = getUserProfile;
// Update user profile
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { profile } = req.body;
        if (!profile) {
            return res.status(400).json({
                success: false,
                message: 'Profile data is required',
                code: 'PROFILE_DATA_REQUIRED'
            });
        }
        // Construct the update object with proper dot notation for nested fields
        const updateFields = {
            updatedAt: new Date()
        };
        // Add profile fields only if they exist in the request
        if (profile.name)
            updateFields['profile.name'] = profile.name;
        if (profile.bio)
            updateFields['profile.bio'] = profile.bio;
        if (profile.avatar)
            updateFields['profile.avatar'] = profile.avatar;
        if (profile.email)
            updateFields['email'] = profile.email;
        // Role-specific updates
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'artist') {
            if (profile.skills)
                updateFields['profile.skills'] = profile.skills;
            if (profile.portfolio)
                updateFields['profile.portfolio'] = profile.portfolio;
            if (profile.commissionRates)
                updateFields['profile.commissionRates'] = profile.commissionRates;
            if (profile.socialMedia)
                updateFields['profile.socialMedia'] = profile.socialMedia;
        }
        else if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === 'buyer') {
            if (profile.shippingAddress) {
                updateFields['profile.shippingAddress'] = Object.assign(Object.assign({}, (profile.shippingAddress || {})), profile.shippingAddress);
            }
        }
        const updatedUser = yield userModel_1.default.findByIdAndUpdate(userId, { $set: updateFields }, {
            new: true,
            runValidators: true,
            select: '-password -oauth'
        });
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
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
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
});
exports.updateUserProfile = updateUserProfile;
// Delete user profile (soft delete)
const deleteUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Instead of actually deleting, we'll mark as inactive
        const updatedUser = yield userModel_1.default.findByIdAndUpdate(userId, { $set: { isActive: false, updatedAt: new Date() } }, { new: true }).select('-password -oauth');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User account deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteUserProfile = deleteUserProfile;
// Get public profile (for other users to view)
const getPublicProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = yield userModel_1.default.findById(userId).select('-password -oauth -email -stripeAccountId');
        if (!user || user.isActive === false) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return only public information
        const publicProfile = Object.assign({ _id: user._id, role: user.role, profile: {
                name: user.profile.name,
                bio: user.profile.bio,
                avatar: user.profile.avatar
            } }, (user.role === 'artist' && {
            portfolio: user.portfolio || [],
            skills: user.skills || [],
            socialMedia: user.socialMedia || [],
            commissionRates: user.commissionRates || []
        }));
        res.status(200).json(publicProfile);
    }
    catch (error) {
        console.error('Error getting public profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPublicProfile = getPublicProfile;
// Update profile picture only
const updateProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { avatar } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!avatar) {
            return res.status(400).json({ message: 'Avatar URL is required' });
        }
        const updatedUser = yield userModel_1.default.findByIdAndUpdate(userId, { $set: { 'profile.avatar': avatar, updatedAt: new Date() } }, { new: true }).select('profile.avatar');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ avatar: updatedUser.profile.avatar });
    }
    catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateProfilePicture = updateProfilePicture;
const getAllArtists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const artists = yield userModel_1.default.find({
            role: 'artist'
        })
            .select('-password -email -oauth -stripeAccountId -__v')
            .lean();
        const formattedArtists = artists
            .map(artist => {
            var _a;
            if (!artist._id || !artist.profile || !artist.profile.name) {
                console.warn('Skipping invalid artist record:', artist);
                return null;
            }
            return {
                _id: artist._id.toString(),
                profile: {
                    name: artist.profile.name,
                    bio: artist.profile.bio || '',
                    avatar: artist.profile.avatar || '/default-avatar.png'
                },
                createdAt: ((_a = artist.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString()) || new Date().toISOString()
            };
        })
            .filter(Boolean);
        return res.status(200).json(formattedArtists);
    }
    catch (error) {
        console.error('Error in getAllArtists:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch artists',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
exports.getAllArtists = getAllArtists;
const getArtistById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const artistId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(artistId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid artist ID',
                code: 'INVALID_ARTIST_ID'
            });
        }
        const artist = yield userModel_1.default.findOne({
            _id: artistId,
            role: 'artist',
            isActive: { $ne: false }
        }).select('-password -email -oauth -stripeAccountId');
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
    }
    catch (error) {
        console.error('Error fetching artist by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});
exports.getArtistById = getArtistById;
module.exports = {
    getUserProfile: exports.getUserProfile,
    updateUserProfile: exports.updateUserProfile,
    deleteUserProfile: exports.deleteUserProfile,
    getPublicProfile: exports.getPublicProfile,
    updateProfilePicture: exports.updateProfilePicture,
    getAllArtists: exports.getAllArtists,
    getArtistById: exports.getArtistById,
};
