import { Request, Response } from "express";
import { prisma } from "../prisma";

export const createLanguage = async (req: Request, res: Response) => {
  try {
    const { name, fileExtension } = req.body;
    const language = await prisma.language.create({ data: { name, fileExtension } });
    res.status(201).json(language);
  } catch (error) {
    res.status(500).json({ error: "Failed to create language" });
  }
};

export const getLanguages = async (_req: Request, res: Response) => {
  try {
    const languages = await prisma.language.findMany();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch languages" });
  }
};
