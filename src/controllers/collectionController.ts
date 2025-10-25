import { Request, Response } from "express";
import { prisma } from "../prisma";

// Создать коллекцию
export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, ownerId, snippetIds } = req.body;
    const collection = await prisma.collection.create({ data: { name, ownerId, snippetIds } });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: "Failed to create collection" });
  }
};

// Получить все коллекции (опционально фильтр по ownerId)
export const getCollections = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    const where: any = {};
    if (ownerId) where.ownerId = ownerId as string;

    const collections = await prisma.collection.findMany({
      where,
      include: { owner: true },
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};
