import { Request, Response } from "express";
import { commentService } from "../services/commentService";
import { ObjectId } from "mongodb";

export const createComment = async (req: Request, res: Response) => {
  try {
    const { text, authorId, snippetId } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const validAuthorId = authorId && ObjectId.isValid(authorId) ? authorId : undefined;
    const validSnippetId = snippetId && ObjectId.isValid(snippetId) ? snippetId : undefined;

    if (!validAuthorId || !validSnippetId) {
      return res.status(400).json({ error: "authorId or snippetId not valid ObjectId" });
    }

    const comment = await commentService.createComment({
      text,
      authorId: validAuthorId,
      snippetId: validSnippetId,
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create comment", details: error });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { snippetId } = req.query;

    const validSnippetId = snippetId && typeof snippetId === "string" && ObjectId.isValid(snippetId) ? snippetId : undefined;

    const comments = await commentService.getComments(validSnippetId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments", details: error });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const comment = await commentService.updateComment(id, { text });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update comment", details: error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await commentService.deleteComment(id);
    res.json({ message: "Comment deleted success" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment", details: error });
  }
};