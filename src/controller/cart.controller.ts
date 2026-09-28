import { Response } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../middleware/authmiddlware";
import { Cart, ICart } from "../models/user-model";
import { Product } from "../models/product-model";

type CartItemInput = { productId: string; quantity: number };

function customerId(req: AuthenticatedRequest, res: Response): string | undefined {
  const id = req.authUser?.id;
  if (!id || !Types.ObjectId.isValid(id)) {
    res.status(401).json({ message: "Invalid access token" });
    return undefined;
  }
  return id;
}

function validProductId(value: unknown, res: Response): value is string {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    res.status(400).json({ message: "Invalid product ID" });
    return false;
  }
  return true;
}

function validQuantity(value: unknown, res: Response): value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    res.status(400).json({ message: "quantity must be a positive whole number" });
    return false;
  }
  return true;
}

function serverError(res: Response, error: unknown): void {
  console.error("Cart operation failed:", error);
  res.status(500).json({ message: "Internal server error" });
}

async function cartResponse(cart: ICart | null, res: Response): Promise<void> {
  if (!cart) {
    res.status(200).json({ items: [], totalAmount: 0 });
    return;
  }

  const products = await Product.find({ _id: { $in: cart.items.map(item => item.product) } })
    .select("name price category stock").lean();
  const byId = new Map(products.map(product => [product._id.toString(), product]));
  const items = cart.items.map(item => {
    const product = byId.get(item.product.toString()) ?? null;
    return {
      product,
      quantity: item.quantity,
      subtotal: product ? product.price * item.quantity : null,
    };
  });

  res.status(200).json({
    items,
    totalAmount: items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0),
  });
}

export async function getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  try {
    await cartResponse(await Cart.findOne({ user }), res);
  } catch (error) { serverError(res, error); }
}

export async function addCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  const body = req.body as Partial<CartItemInput> | undefined;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some(key => !["productId", "quantity"].includes(key))) {
    res.status(400).json({ message: "Provide only productId and quantity" });
    return;
  }
  if (!validProductId(body.productId, res) || !validQuantity(body.quantity, res)) return;
  const productId = body.productId.toLowerCase();

  try {
    const product = await Product.findById(productId);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    const cart = await Cart.findOne({ user }) ?? new Cart({ user, items: [] });
    const item = cart.items.find(entry => entry.product.toString() === productId);
    const newQuantity = (item?.quantity ?? 0) + body.quantity;
    if (!Number.isSafeInteger(newQuantity) || newQuantity > product.stock) {
      res.status(409).json({ message: "Requested quantity exceeds available stock" });
      return;
    }
    if (item) item.quantity = newQuantity;
    else cart.items.push({ product: new Types.ObjectId(productId), quantity: newQuantity });
    await cart.save();
    await cartResponse(cart, res);
  } catch (error) { serverError(res, error); }
}

export async function updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  const rawProductId = req.params.productId;
  if (!validProductId(rawProductId, res)) return;
  const productId = rawProductId.toLowerCase();
  const body = req.body as { quantity?: unknown } | undefined;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !validQuantity(body.quantity, res)) return;

  try {
    const cart = await Cart.findOne({ user });
    const item = cart?.items.find(entry => entry.product.toString() === productId);
    if (!cart || !item) { res.status(404).json({ message: "Item not in cart" }); return; }
    const product = await Product.findById(productId);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    if (body.quantity > product.stock) {
      res.status(409).json({ message: "Requested quantity exceeds available stock" });
      return;
    }
    item.quantity = body.quantity;
    await cart.save();
    await cartResponse(cart, res);
  } catch (error) { serverError(res, error); }
}

export async function removeCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  const rawProductId = req.params.productId;
  if (!validProductId(rawProductId, res)) return;
  const productId = rawProductId.toLowerCase();

  try {
    const cart = await Cart.findOne({ user });
    if (!cart || !cart.items.some(item => item.product.toString() === productId)) {
      res.status(404).json({ message: "Item not in cart" });
      return;
    }
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    await cartResponse(cart, res);
  } catch (error) { serverError(res, error); }
}
