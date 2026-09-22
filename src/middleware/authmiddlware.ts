import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type UserRole = "user" | "admin" | "seller" | "buyer" | "expediter";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    role: UserRole;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.header("authorization");

  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      message: "Server authentication is not configured",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    if (!payload.sub || typeof payload.role !== "string") {
      res.status(401).json({ message: "Invalid access token" });
      return;
    }

    req.authUser = {
      id: payload.sub,
      role: payload.role as UserRole,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.authUser?.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
};

export const requireSelfOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const isAdmin = req.authUser?.role === "admin";
  const isOwner = req.authUser?.id === req.params.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({
      message: "You cannot access another user's account",
    });
    return;
  }

  next();
};