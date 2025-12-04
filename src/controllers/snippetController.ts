import { Request, Response } from "express";
import {
  createSnippetService,
  getSnippetsService,
  getSnippetByIdService,
  updateSnippetService,
  deleteSnippetService,
} from "../services/snippetService";

// Создать сниппет
export const createSnippet = async (req: Request, res: Response) => {
  try {
    const { title, code, languageId, authorId, tags } = req.body;

    if (!title || !code) {
      return res.status(400).json({ error: "Missing required fields: title or code" });
    }

    const snippet = await createSnippetService({ title, code, languageId, authorId, tags });
    res.status(201).json(snippet);
  } catch (error: any) {
    console.error("Error creating snippet:", error);
    res.status(500).json({ error: "Failed to create snippet", details: error });
  }
};

// Получить все сниппеты (с фильтрацией)
export const getSnippets = async (req: Request, res: Response) => {
  try {
    const { tag, languageId } = req.query;

    const snippets = await getSnippetsService({
      tag: typeof tag === "string" ? tag : undefined,
      languageId: typeof languageId === "string" ? languageId : undefined,
    });

    res.json(snippets);
  } catch (error: any) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({ error: "Failed to fetch snippets", details: error });
  }
};

// Получить сниппет по ID
export const getSnippetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const snippet = await getSnippetByIdService(id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (error) {
    console.error("Error fetching snippet:", error);
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
};

// Обновить сниппет
export const updateSnippet = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, code, languageId, tags } = req.body;

  try {
    const snippet = await updateSnippetService(id, { title, code, languageId, tags });
    res.json(snippet);
  } catch (error: any) {
    console.error("Error updating snippet:", error);
    res.status(500).json({ error: "Failed to update snippet", details: error });
  }
};

// Удалить сниппет
export const deleteSnippet = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await deleteSnippetService(id);
    res.json({ message: "Snippet deleted" });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    res.status(500).json({ error: "Failed to delete snippet" });
  }
};