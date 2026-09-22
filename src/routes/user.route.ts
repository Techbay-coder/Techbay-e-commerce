import express from "express";

import {
  createUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
} from "../controller/user.controller";

import {
  authenticateToken,
  requireAdmin,
  requireSelfOrAdmin,
} from "../middleware/authmiddlware";

const router = express.Router();

router.post("/users", createUser);
router.post("/users/login", loginUser);

router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  getAllUsers
);

router
  .route("/users/:id")
  .all(authenticateToken, requireSelfOrAdmin)
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

export default router;