"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const artworkSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const Artwork = mongoose_1.default.model("Artwork", artworkSchema);
exports.default = Artwork;
