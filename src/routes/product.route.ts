import { Router } from "express";
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from "../controller/product.controller";
import { authenticateToken, requireAdmin } from "../middleware/authmiddlware";

const router = Router();
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", authenticateToken, requireAdmin, createProduct);
router.put("/:id", authenticateToken, requireAdmin, updateProduct);
router.delete("/:id", authenticateToken, requireAdmin, deleteProduct);

export default router;
