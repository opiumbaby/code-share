import { Request, Response } from "express";
import { prisma } from "../prisma";

// Создать коллекцию
export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, ownerId, snippetIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        ownerId: ownerId || undefined, // опциональный owner
        snippetIds: snippetIds || [],
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection", details: error });
  }
};

// Получить все коллекции (опционально фильтр по ownerId)
export const getCollections = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    const where: any = {};
    if (ownerId && typeof ownerId === "string") {
      where.ownerId = ownerId;
    }

    const collections = await prisma.collection.findMany({
      where,
      include: { owner: true },
    });

    // Убираем коллекции с осиротевшими owner
    const safeCollections = collections.filter(c => c.owner !== null);

    res.json(safeCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections", details: error });
  }
};
