import mongoose, { Document, Schema, Types } from "mongoose";
import './artworkModel';

export type CartItemType = 'artwork' | 'course';

interface ImageData {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface ICartItem extends Document {
  _id: Types.ObjectId; 
  itemType: CartItemType;
  itemId: Types.ObjectId;
  price: number;
  title: string;
  quantity: number;
  images?: ImageData[];
  thumbnail?: string;
  addedAt: Date;
  artistId?: Types.ObjectId;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<ImageData>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  width: { type: Number },
  height: { type: Number }
}, { _id: false });

const cartItemSchema = new Schema<ICartItem>({
  itemType: {
    type: String,
    enum: ["artwork", "course"],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "items.itemType"
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  title: {
    type: String,
    required: true
  },
  artistId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  images: {
    type: [imageSchema],
    default: []
  },
  thumbnail: { 
    type: String 
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true
});

// Validate itemId references
cartSchema.path('items').validate(function (items: ICartItem[]) {
  return items.every(item => Types.ObjectId.isValid(item.itemId));
}, 'Invalid itemId in cart items');

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;