import { Request, Response } from "express";
import { Product } from "../models/product-model";

type ProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
};

function parseProduct(body: unknown, partial = false): Partial<ProductInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Provide a JSON product object");
  }
  const source = body as Record<string, unknown>;
  const allowed = ["name", "description", "price", "category", "stock"];
  if (Object.keys(source).some(key => !allowed.includes(key))) {
    throw new Error("Only name, description, price, category and stock are allowed");
  }
  const result: Partial<ProductInput> = {};
  for (const [key, max] of [["name", 120], ["description", 5000], ["category", 80]] as const) {
    const value = source[key];
    if (partial && value === undefined) continue;
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
      throw new Error(`${key} must be text between 1 and ${max} characters`);
    }
    result[key] = value.trim();
  }
  for (const key of ["price", "stock"] as const) {
    const value = source[key];
    if (partial && value === undefined) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
        (key === "stock" && !Number.isSafeInteger(value))) {
      throw new Error(`${key} must be a non-negative ${key === "stock" ? "whole number" : "number"}`);
    }
    result[key] = value;
  }
  if (!Object.keys(result).length) throw new Error("Provide at least one product field");
  return result;
}

function readBody(req: Request, res: Response, partial = false) {
  try { return parseProduct(req.body, partial); }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return undefined;
  }
}

function validId(req: Request, res: Response): boolean {
  if (typeof req.params.id !== "string" || !/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(400).json({ message: "Invalid product ID" });
    return false;
  }
  return true;
}

function serverError(res: Response, error: unknown): void {
  console.error("Product operation failed:", error);
  res.status(500).json({ message: "Internal server error" });
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const data = readBody(req, res);
  if (!data) return;
  try { res.status(201).json(await Product.create(data)); }
  catch (error) { serverError(res, error); }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ?? "1";
  const limit = req.query.limit ?? "20";
  if (typeof page !== "string" || typeof limit !== "string" ||
      !/^[1-9]\d*$/.test(page) || !/^[1-9]\d*$/.test(limit) ||
      !Number.isSafeInteger(Number(page)) || Number(page) > 10000 || Number(limit) > 100) {
    res.status(400).json({ message: "page must be 1–10000 and limit must be 1–100" });
    return;
  }
  try {
    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1, _id: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
      Product.countDocuments(),
    ]);
    res.json({ products, total, page: Number(page), limit: Number(limit) });
  } catch (error) { serverError(res, error); }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req, res)) return;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    res.json(product);
  } catch (error) { serverError(res, error); }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req, res)) return;
  const data = readBody(req, res, true);
  if (!data) return;
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    res.json(product);
  } catch (error) { serverError(res, error); }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  if (!validId(req, res)) return;
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    res.status(204).send();
  } catch (error) { serverError(res, error); }
};
