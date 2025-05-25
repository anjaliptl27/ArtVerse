import mongoose, { Document, Schema, Types } from "mongoose";
import './artworkModel';
import './courseModel';

export type WishlistItemType = "artwork" | "course";

interface ImageData {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface IWishlistItem {
  _id: Types.ObjectId;
  itemType: WishlistItemType;
  itemId: Types.ObjectId;
  title: string;
  price: number;
  images?: ImageData[];
  thumbnail?: {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
  };
  addedAt: Date;
  artistId?: Types.ObjectId; 
}

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<ImageData>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  width: { type: Number },
  height: { type: Number }
}, { _id: false });

const wishlistItemSchema = new Schema<IWishlistItem>({
  itemType: {
    type: String,
    enum: ["artwork", "course"],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "itemType"
  },
  title: { type: String, required: true },         
  price: { type: Number, required: true },          
  artistId: { type: Schema.Types.ObjectId, ref: 'User' },
  thumbnail: {type: String}, 
 images: [imageSchema],
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const wishlistSchema = new Schema<IWishlist>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: {
    type: [wishlistItemSchema],
    default: []
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Type guard for wishlist items
wishlistSchema.path('items').validate(function (items: IWishlistItem[]) {
  return items.every(item => Types.ObjectId.isValid(item.itemId));
}, 'Invalid itemId in wishlist items');

const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;

