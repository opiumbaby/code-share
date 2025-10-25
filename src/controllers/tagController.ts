import { Request, Response } from "express";
import { prisma } from "../prisma";

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const tag = await prisma.tag.create({ data: { name } });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tag" });
  }
};

export const getTags = async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};
