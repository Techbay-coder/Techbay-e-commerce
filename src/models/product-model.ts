import { Schema, model } from "mongoose";

export interface IProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  // Price is in NGN; checkout will convert amounts to kobo.
  price: { type: Number, required: true, min: 0, validate: Number.isFinite },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
}, { timestamps: true });

export const Product = model<IProduct>("Product", productSchema);
