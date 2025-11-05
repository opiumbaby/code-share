import { Request, Response } from "express";
import { prisma } from "../prisma";


export const createUser = async (req: Request, res: Response) => {
  console.log("Received body:", req.body); // Логируем, что приходит
  console.log("REQ.BODY:", req.body);
  try {
    const { email, username, role } = req.body;

    // Проверка обязательных полей
    if (!email || !username || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await prisma.user.create({
      data: { email, username, role },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Ошибка уникальности email или username
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }

    res.status(500).json({ error: "Failed to create user", details: error });
  }
};


export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};


export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, username, role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { email, username, role },
    });
    res.json(user);
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
