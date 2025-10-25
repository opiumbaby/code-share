import { Router } from "express";
import { createTag, getTags } from "../controllers/tagController";

const router = Router();

router.post("/", createTag);  // Создать тег
router.get("/", getTags);     // Получить все теги

export default router;
