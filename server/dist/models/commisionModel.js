"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/*const referenceImageSchema = new Schema<IReferenceImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: true });
*/
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: String,
        enum: ["buyer", "artist"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    //attachments: [String],
    sentAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });
const commissionSchema = new mongoose_1.Schema({
    buyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    artistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    //referenceImages: [referenceImageSchema],
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    deadline: Date,
    sizeRequirements: String,
    stylePreferences: String,
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"],
        default: "pending"
    },
    messages: [messageSchema],
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    }
}, {
    timestamps: true
});
const Commission = mongoose_1.default.model("Commission", commissionSchema);
exports.default = Commission;
