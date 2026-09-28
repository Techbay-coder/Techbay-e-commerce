import { Router } from "express";
import { authenticateToken } from "../middleware/authmiddlware";
import { createOrder, getOrderById, getOrders } from "../controller/order.controller";

const router = Router();
router.use(authenticateToken);
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;
