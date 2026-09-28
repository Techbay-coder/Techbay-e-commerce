
import { Schema, Types, model, Document } from "mongoose";


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "seller" | "buyer" | "expediter";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["user", "admin", "seller", "buyer", "expediter"],
      default: "user",
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);


export { Product as Products } from "./product-model";
export type { IProduct } from "./product-model";

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}
const cartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});
cartSchema.index({ user: 1 }, { unique: true });

export const Cart = model<ICart>("Cart", cartSchema);

 export interface IOrderItem extends Document {
  product: Types.ObjectId;
  quantity: Number;
  name: string;

}

  export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  createdAt: Date;

}

export const orderSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "shipped", "completed", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Order = model<IOrder>("Order", orderSchema);





