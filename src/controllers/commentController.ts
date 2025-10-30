import { Request, Response } from "express";
import { prisma } from "../prisma";
import { ObjectId } from "mongodb";

// Создать комментарий
export const createComment = async (req: Request, res: Response) => {
  console.log("REQ.BODY:", req.body);
  try {
    const { text, authorId, snippetId } = req.body;

    if (!text) return res.status(400).json({ error: "Text is required" });

    // Проверяем валидность ObjectId
    const validAuthorId = authorId && ObjectId.isValid(authorId) ? authorId : undefined;
    const validSnippetId = snippetId && ObjectId.isValid(snippetId) ? snippetId : undefined;

    if (!validAuthorId || !validSnippetId) {
      return res.status(400).json({ error: "authorId and snippetId must be valid ObjectId" });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        authorId: validAuthorId,
        snippetId: validSnippetId,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment", details: error });
  }
};

// Получить все комментарии для сниппета
export const getComments = async (req: Request, res: Response) => {
  try {
    const { snippetId } = req.query;

    const where: any = {};
    if (snippetId && typeof snippetId === "string" && ObjectId.isValid(snippetId)) {
      where.snippetId = snippetId;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: true,
        snippet: true,
      },
    });

    // Убираем комментарии с осиротевшими связями
    const safeComments = comments.filter(c => c.author !== null && c.snippet !== null);

    res.json(safeComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments", details: error });
  }
};
