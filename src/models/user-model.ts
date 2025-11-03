
import { Schema, Types, model,Document } from "mongoose";


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "seller" | "buyer" | "expediter";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = model("/User", userSchema);


export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}
  const productsSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

});
export const Products = model("Product", productsSchema);

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}
const cartSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const Cart = model("/Cart", cartSchema);

 interface IOrderItem extends Document {
  product: Types.ObjectId;
  quantity: Number;

}

interface IOrder extends Document {
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

export const Order = model<IOrder>("/Order", orderSchema);







