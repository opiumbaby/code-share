import { Router } from "express";
import { createComment, getComments, deleteComment } from "../controllers/commentController";

const router = Router();

router.post("/", createComment);
router.get("/", getComments);
router.delete("/:id", deleteComment);

export default router;