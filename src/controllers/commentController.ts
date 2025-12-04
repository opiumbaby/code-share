import { Request, Response } from "express";
import { commentService } from "../services/commentService";
import { ObjectId } from "mongodb";

export const createComment = async (req: Request, res: Response) => {
  console.log("REQ.BODY:", req.body);
  try {
    const { text, authorId, snippetId } = req.body;

    // Валидация
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Проверка валидности ObjectId
    const validAuthorId = authorId && ObjectId.isValid(authorId) ? authorId : undefined;
    const validSnippetId = snippetId && ObjectId.isValid(snippetId) ? snippetId : undefined;

    if (!validAuthorId || !validSnippetId) {
      return res.status(400).json({ error: "authorId and snippetId must be valid ObjectId" });
    }

    const comment = await commentService.createComment({
      text,
      authorId: validAuthorId,
      snippetId: validSnippetId,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment", details: error });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { snippetId } = req.query;

    // Валидация snippetId
    const validSnippetId =
      snippetId && typeof snippetId === "string" && ObjectId.isValid(snippetId)
        ? snippetId
        : undefined;

    const comments = await commentService.getComments(validSnippetId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments", details: error });
  }
};