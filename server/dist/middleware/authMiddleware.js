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
exports.authorizeRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const userModel_1 = __importDefault(require("../models/userModel"));
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Cookies:', req.cookies); // Log cookies
    console.log('Headers:', req.headers); // Log headers
    let token;
    // Check cookies first
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) {
        token = req.cookies.token;
        console.log('Found token in cookies:', token);
    }
    if (!token) {
        console.log('No token found');
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Verify user still exists
        const user = yield userModel_1.default.findById(decoded._id).select('role email');
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        // Attach user to request with proper typing
        req.user = {
            _id: new mongoose_1.Types.ObjectId(decoded._id),
            role: user.role,
            email: user.email
        };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.error('Token verification error:', err);
        return res.status(401).json({ message: 'Authentication failed' });
    }
});
exports.verifyToken = verifyToken;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden - Required roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
module.exports = { verifyToken: exports.verifyToken, authorizeRoles: exports.authorizeRoles };
