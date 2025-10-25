import { Router } from "express";
import { createLanguage, getLanguages } from "../controllers/languageController";

const router = Router();

router.post("/", createLanguage);  // Создать язык
router.get("/", getLanguages);     // Получить все языки

export default router;
