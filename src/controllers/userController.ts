import { Request, Response } from "express";
import {
  createUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "../services/userService";

// Создать пользователя
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, username, role } = req.body;

    if (!email || !username || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await createUserService({ email, username, role });
    res.status(201).json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email or username already exists" });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

// Получить всех пользователей
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getUsersService();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Получить одного пользователя по ID
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await getUserByIdService(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Обновить пользователя
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, username, role } = req.body;

  try {
    const user = await updateUserService(id, { email, username, role });
    res.json(user);
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email or username already exists" });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
};

// Удалить пользователя
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteUserService(id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};