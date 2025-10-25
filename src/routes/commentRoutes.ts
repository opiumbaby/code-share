import { Router } from "express";
import { createComment, getComments } from "../controllers/commentController";

const router = Router();

router.post("/", createComment);  // Создать комментарий
router.get("/", getComments);     // Получить комментарии (по snippetId)

export default router;
