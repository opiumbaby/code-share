import { Request, Response } from "express";
import { prisma } from "../prisma";

// Создать сниппет
export const createSnippet = async (req: Request, res: Response) => {
  try {
    const { title, code, languageId, authorId, tags } = req.body;
    const snippet = await prisma.snippet.create({ data: { title, code, languageId, authorId, tags } });
    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ error: "Failed to create snippet" });
  }
};

// Получить все сниппеты (с фильтрацией)
export const getSnippets = async (req: Request, res: Response) => {
  try {
    const { tag, languageId } = req.query;
    const where: any = {};
    if (tag) where.tags = { has: tag };
    if (languageId) where.languageId = languageId as string;

    const snippets = await prisma.snippet.findMany({
      where,
      include: { author: true, language: true, comments: true },
    });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
};
