import { Router } from "express";
import { authenticateToken } from "../middleware/authmiddlware";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "../controller/cart.controller";

const router = Router();

router.use(authenticateToken);
router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);

export default router;
