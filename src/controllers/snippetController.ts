import { Request, Response } from "express";
import { prisma } from "../prisma";

// Создать сниппет
export const createSnippet = async (req: Request, res: Response) => {
  try {
    const { title, code, languageId, authorId, tags } = req.body;

    // Проверяем обязательные поля
    if (!title || !code) {
      return res.status(400).json({ error: "Missing required fields: title or code" });
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        code,
        languageId: languageId || undefined, // undefined для опционального поля
        authorId: authorId || undefined,     // undefined для опционального поля
        tags: tags || [],
      },
    });

    res.status(201).json(snippet);
  } catch (error) {
    console.error("Error creating snippet:", error);
    res.status(500).json({ error: "Failed to create snippet", details: error });
  }
};

// Получить все сниппеты с фильтрацией
export const getSnippets = async (req: Request, res: Response) => {
  try {
    const { tag, languageId } = req.query;
    const where: any = {};

    if (tag && typeof tag === "string") where.tags = { has: tag };
    if (languageId && typeof languageId === "string") where.languageId = languageId;

    const snippets = await prisma.snippet.findMany({
      where,
      include: {
        author: true,    // теперь опционально
        language: true,  // теперь опционально
        comments: true,
      },
    });

    // Убираем "осиротевшие" записи, если author или language == null
    const safeSnippets = snippets.filter(s => s.author !== null && s.language !== null);

    res.json(safeSnippets);
  } catch (error) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({ error: "Failed to fetch snippets", details: error });
  }
};
