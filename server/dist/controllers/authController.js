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
const userModel_1 = __importDefault(require("../models/userModel"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_EXPIRES_IN = parseInt(process.env.COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = req.body;
        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password and name are required" });
        }
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        const user = new userModel_1.default({
            email,
            password: hashedPassword,
            profile: { name },
            role: role || 'buyer'
        });
        yield user.save();
        // Create token for immediate login after registration
        const token = jsonwebtoken_1.default.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_EXPIRES_IN,
        });
        return res.status(201).json({
            message: "User registered successfully",
            userId: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token
        });
    }
    catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_EXPIRES_IN,
        });
        return res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            message: "Login successful",
        });
    }
    catch (err) {
        console.error("Error logging in user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.status(200).json({ message: 'Logged out successfully' });
};
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // The verifyToken middleware will attach the user to req.user
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        // Fetch fresh user data from database
        const user = yield userModel_1.default.findById(req.user._id)
            .select('-password') // Exclude password
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile
        });
    }
    catch (err) {
        console.error("Error fetching current user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};
