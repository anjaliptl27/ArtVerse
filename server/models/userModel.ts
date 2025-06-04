import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "artist" | "buyer" | "admin";

export interface IUserProfile {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
  portfolio?: string[];
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  commissionRates?: {
    kind: string;
    price: number;
    description?: string;
  }[];
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface IOAuth {
  googleId?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  profile: IUserProfile;
  stripeAccountId?: string;
  oauth: IOAuth;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["artist", "buyer", "admin"],
    required: true,
    default: "buyer",
  },
  profile: {
    name: {
      type: String,
      required: true,
    },
    bio: String,
    avatar: String,
  skills: [String],
    portfolio: [String],
    socialMedia: [{
      platform: String,
      url: String
    }],
    commissionRates: [{
      kind: String,
      price: Number,
      description: String
    }],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  stripeAccountId: String,
  oauth: {
    googleId: String,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

userSchema.pre<IUser>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;