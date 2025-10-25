import { Router } from "express";
import { createSnippet, getSnippets } from "../controllers/snippetController";

const router = Router();

router.post("/", createSnippet);  // Создать сниппет
router.get("/", getSnippets);     // Получить все сниппеты (с фильтрацией по тегам и языкам)

export default router;
