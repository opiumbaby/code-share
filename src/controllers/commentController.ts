import { Request, Response } from "express";
import { prisma } from "../prisma";

// Создать комментарий
export const createComment = async (req: Request, res: Response) => {
  try {
    const { text, authorId, snippetId } = req.body;
    const comment = await prisma.comment.create({ data: { text, authorId, snippetId } });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// Получить все комментарии для сниппета
export const getComments = async (req: Request, res: Response) => {
  try {
    const { snippetId } = req.query;
    const where: any = {};
    if (snippetId) where.snippetId = snippetId as string;

    const comments = await prisma.comment.findMany({
      where,
      include: { author: true, snippet: true },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};
