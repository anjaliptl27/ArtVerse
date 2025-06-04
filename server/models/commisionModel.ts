import mongoose, { Document, Schema, Types } from "mongoose";

export type CommissionStatus = 
  | "pending" 
  | "accepted" 
  | "rejected" 
  | "in_progress" 
  | "completed" 
  | "cancelled";

export type PaymentStatus = 
  | "pending" 
  | "paid" 
  | "refunded";

export interface IReferenceImage {
  url: string;
  publicId: string;
  _id?: Types.ObjectId;
}

export interface ICommissionMessage {
  sender: "buyer" | "artist";
  content: string;
  //attachments: string[];
  sentAt: Date;
  _id?: Types.ObjectId;
}

export interface ICommission extends Document {
  buyerId: Types.ObjectId;
  artistId: Types.ObjectId;
  title: string;
  description: string;
  //referenceImages: IReferenceImage[];
  budget: number;
  deadline?: Date;
  sizeRequirements?: string;
  stylePreferences?: string;
  status: CommissionStatus;
  messages: ICommissionMessage[];
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/*const referenceImageSchema = new Schema<IReferenceImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: true });
*/

const messageSchema = new Schema<ICommissionMessage>({
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


const commissionSchema = new Schema<ICommission>({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  artistId: {
    type: Schema.Types.ObjectId,
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

const Commission = mongoose.model<ICommission>("Commission", commissionSchema);

export default Commission;