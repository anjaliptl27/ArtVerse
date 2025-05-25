import mongoose, { Document, Schema } from "mongoose";

// Interface for the artwork document
interface IArtwork extends Document {
  title: string;
  description: string;
  artistId: mongoose.Types.ObjectId;
  category: "Painting" | "Sketch" | "Digital" | "Sculpture" | "Photography";
  price: number;
  stock: number;
  images: Array<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
  }>;
  isWishlisted?: boolean;
  isInCart?: boolean;
  status: "pending" | "approved" | "rejected";
  approvedAt?: Date;
  rejectionReason?: 'low_quality' | 'copyright_issues' | 'inappropriate_content' | 'other'| null;
  tags: string[];
  stats: {
    views: number;
    likes: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const artworkSchema: Schema<IArtwork> = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  category: {
    type: String,
    enum: ["Painting", "Sketch", "Digital", "Sculpture", "Photography"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number },
    height: { type: Number }
  }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending", 
  },
  approvedAt: Date,
  rejectionReason: {
    type: String,
    enum: [
      'low_quality',
      'copyright_issues',
      'inappropriate_content',
      'other',
      null
    ]
  },
  tags: [String],
  stats: {
    views: {
      type: Number,
      default: 0, 
    },
    likes: {
      type: Number,
      default: 0, 
    },
  },
}, { timestamps: true }); 

artworkSchema.index({ title: 'text', description: 'text' });
artworkSchema.index({ category: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ 'stats.views': -1 });
artworkSchema.index({ category: 1, price: 1 });


const Artwork = mongoose.model<IArtwork>("Artwork", artworkSchema);

export default Artwork;
export type {IArtwork};