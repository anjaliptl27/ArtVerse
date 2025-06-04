import mongoose, { Document, Schema } from "mongoose";

type OrderStatus = "pending" | "completed" | "shipped" | "delivered" | "cancelled" | "refunded";
type PayoutStatus = "pending" | "processed" | "failed";
type ItemType = "artwork" | "course";

interface IOrderItem {
  itemType: ItemType;
  itemId: mongoose.Types.ObjectId;
  price: number;
  title: string;
}

interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  total: number;
  stripePaymentId: string;
  shippingAddress?: IShippingAddress;
  status: OrderStatus;
  payoutStatus: PayoutStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
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
  }
});

const orderSchema = new Schema<IOrder>({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  stripePaymentId: {
    type: String,
    required: true,
    unique: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ["pending", "completed", "shipped", "delivered", "cancelled", "refunded"],
    default: "pending"
  },
  payoutStatus: {
    type: String,
    enum: ["pending", "processed", "failed"],
    default: "pending"
  }
}, { timestamps: true });

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
export type { IOrder, IOrderItem, OrderStatus, PayoutStatus, ItemType };