import mongoose, { Document, Schema } from "mongoose";

export type NotificationType = 
  | "payout" 
  | "approval" 
  | "purchase" 
  | "system"
  | "new_commission"       
  | "commission_update"    
  | "commission_message"  
  | "artwork_approved"   
  | "artwork_rejected";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: [
      "payout", 
      "approval", 
      "purchase", 
      "system",
      "new_commission",       
      "commission_update",    
      "commission_message",  
      "artwork_approved",   
      "artwork_rejected"     
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;