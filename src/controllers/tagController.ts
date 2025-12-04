import { Request, Response } from "express";
import {
  createTagService,
  getTagsService,
  getTagByIdService,
  updateTagService,
  deleteTagService,
} from "../services/tagService";

// Создать тег
export const createTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const tag = await createTagService({ name });
    res.status(201).json(tag);
  } catch (error: any) {
    console.error("Error creating tag:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Tag name already exists" });
    }

    res.status(500).json({ error: "Failed to create tag" });
  }
};

// Получить все теги
export const getTags = async (_req: Request, res: Response) => {
  try {
    const tags = await getTagsService();
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};

// Получить тег по ID
export const getTagById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tag = await getTagByIdService(id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    res.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    res.status(500).json({ error: "Failed to fetch tag" });
  }
};

// Обновить тег
export const updateTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const tag = await updateTagService(id, { name });
    res.json(tag);
  } catch (error: any) {
    console.error("Error updating tag:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Tag name already exists" });
    }

    res.status(500).json({ error: "Failed to update tag" });
  }
};

// Удалить тег
export const deleteTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteTagService(id);
    res.json({ message: "Tag deleted" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: "Failed to delete tag" });
  }
};