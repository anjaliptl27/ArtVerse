import { Request, Response } from 'express';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';
import jwt, {SignOptions} from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_EXPIRES_IN = parseInt(process.env.COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000;

const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password, name, role } = req.body;
        
        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password and name are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            password: hashedPassword,
            profile: { name },
            role: role || 'buyer'
        });

        await user.save();

        // Create token for immediate login after registration
        const token = jwt.sign(
            { _id: user._id, role: user.role, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
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
    } catch (err) {
        console.error("Error registering user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password); 
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: COOKIE_EXPIRES_IN,
        });

        return res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            message: "Login successful",
        });
    } catch (err) {
        console.error("Error logging in user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const logout = (req: Request, res: Response): Response => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,

    });
    return res.status(200).json({ message: 'Logged out successfully' });
};


const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // The verifyToken middleware will attach the user to req.user
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch fresh user data from database
    const user = await User.findById(req.user._id)
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
  } catch (err) {
    console.error("Error fetching current user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports= {
    register,
    login,
    logout,
    getCurrentUser
};