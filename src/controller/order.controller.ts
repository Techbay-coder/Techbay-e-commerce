import { Response } from "express";
import mongoose, { Types } from "mongoose";
import { AuthenticatedRequest } from "../middleware/authmiddlware";
import { Cart, IOrder, IOrderItem, Order } from "../models/user-model";
import { Product } from "../models/product-model";

class OrderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function customerId(req: AuthenticatedRequest, res: Response): string | undefined {
  const id = req.authUser?.id;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    res.status(401).json({ message: "Invalid access token" });
    return undefined;
  }
  return id;
}

function sendError(res: Response, error: unknown): void {
  if (error instanceof OrderError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  console.error("Order operation failed:", error);
  res.status(500).json({ message: "Internal server error" });
}

function priceInKobo(price: number): number {
  const kobo = Math.round(price * 100);
  if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(kobo) ||
      Math.abs(kobo / 100 - price) > 1e-8) {
    throw new OrderError(409, "A product price is invalid; update the product before ordering");
  }
  return kobo;
}

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  if (req.body && (typeof req.body !== "object" || Array.isArray(req.body) || Object.keys(req.body).length)) {
    res.status(400).json({ message: "Create an order from your cart without a request body" });
    return;
  }

  try {
    // The cart clear and order insert must succeed or fail together.
    const order = await mongoose.connection.transaction(async session => {
      const cart = await Cart.findOne({ user }).session(session);
      if (!cart?.items.length) throw new OrderError(400, "Cart is empty");

      const products = await Product.find({ _id: { $in: cart.items.map(item => item.product) } })
        .select("name price stock").session(session).lean();
      const byId = new Map(products.map(product => [product._id.toString(), product]));
      const items: IOrderItem[] = [];
      let totalAmountKobo = 0;
      const seen = new Set<string>();

      for (const cartItem of cart.items) {
        const id = cartItem.product.toString();
        const product = byId.get(id);
        if (!product || seen.has(id)) throw new OrderError(409, "Cart contains a missing or duplicate product");
        seen.add(id);
        if (!Number.isSafeInteger(cartItem.quantity) || cartItem.quantity < 1 ||
            cartItem.quantity > product.stock) {
          throw new OrderError(409, "A product in the cart has insufficient stock");
        }
        const unitPriceKobo = priceInKobo(product.price);
        const lineTotalKobo = unitPriceKobo * cartItem.quantity;
        if (!Number.isSafeInteger(lineTotalKobo) || !Number.isSafeInteger(totalAmountKobo + lineTotalKobo)) {
          throw new OrderError(409, "Order total is too large");
        }
        totalAmountKobo += lineTotalKobo;
        items.push({ product: new Types.ObjectId(id), name: product.name,
          quantity: cartItem.quantity, unitPriceKobo, lineTotalKobo });
      }

      const [created] = await Order.create([{ user, items, totalAmountKobo, status: "pending" }], { session });
      if (!created) throw new Error("Order creation failed");
      cart.items = [];
      await cart.save({ session });
      return created;
    });
    res.status(201).json(order);
  } catch (error) { sendError(res, error); }
}

export async function getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  try {
    const orders = await Order.find({ user }).sort({ createdAt: -1, _id: -1 }).limit(50);
    res.status(200).json(orders);
  } catch (error) { sendError(res, error); }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = customerId(req, res);
  if (!user) return;
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    res.status(400).json({ message: "Invalid order ID" });
    return;
  }
  try {
    const order: IOrder | null = await Order.findOne({ _id: id, user });
    if (!order) { res.status(404).json({ message: "Order not found" }); return; }
    res.status(200).json(order);
  } catch (error) { sendError(res, error); }
}
