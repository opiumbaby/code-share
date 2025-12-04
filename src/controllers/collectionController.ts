import { Request, Response } from "express";
import { collectionService } from "../services/collectionService";

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { name, ownerId, snippetIds } = req.body;

    // Валидация
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const collection = await collectionService.createCollection({
      name,
      ownerId,
      snippetIds,
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection", details: error });
  }
};

export const getCollections = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;

    const collections = await collectionService.getCollections(
      typeof ownerId === "string" ? ownerId : undefined
    );

    res.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections", details: error });
  }
};