import { Request, Response } from "express";
import { languageService } from "../services/languageService";

export const createLanguage = async (req: Request, res: Response) => {
  try {
    const { name, fileExtension } = req.body;
    const language = await languageService.createLanguage({ name, fileExtension });
    res.status(201).json(language);
  } catch (error) {
    res.status(500).json({ error: "Failed to create language" });
  }
};

export const getLanguages = async (_req: Request, res: Response) => {
  try {
    const languages = await languageService.getAllLanguages();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch languages" });
  }
};