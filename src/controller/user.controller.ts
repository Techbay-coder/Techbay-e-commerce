import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user-model";

interface RegisterUserBody {
  name: string;
  email: string;
  password: string;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginUserBody {
  email: string;
  password: string;
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user: InstanceType<typeof User>) => {
  const { password: _password, ...safeUser } = user.toObject();
  return safeUser;
};

const createAccessToken = (user: InstanceType<typeof User>): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    { role: user.role },
    secret,
    {
      subject: user.id,
      expiresIn: "7d",
    }
  );
};
const createUser = async (
  req: Request<{}, {}, RegisterUserBody>,
  res: Response
): Promise<void> => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    if (!emailPattern.test(email)) {
      res.status(400).json({ message: "Enter a valid email address" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json(publicUser(newUser));
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createUser };

const loginUser = async (
  req: Request<{}, {}, LoginUserBody>,
  res: Response
): Promise<void> => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = createAccessToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Error logging in:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { loginUser };
const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { getAllUsers };

const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { getUserById };

const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserBody>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const updateData: UpdateUserBody = {};

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) {
        res.status(400).json({ message: "Name cannot be empty" });
        return;
      }
      updateData.name = name;
    }

    if (req.body.email !== undefined) {
      const email = req.body.email.trim().toLowerCase();
      if (!emailPattern.test(email)) {
        res.status(400).json({ message: "Enter a valid email address" });
        return;
      }
      updateData.email = email;
    }

    if (req.body.password !== undefined) {
      if (req.body.password.length < 8) {
        res.status(400).json({ message: "Password must be at least 8 characters" });
        return;
      }
      updateData.password = await bcrypt.hash(req.body.password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "Provide a name, email or password to update" });
      return;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { updateUser };

const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export { deleteUser };
