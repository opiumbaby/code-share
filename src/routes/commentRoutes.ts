import { Router } from "express";
import { createComment, getComments, deleteComment, updateComment } from "../controllers/commentController";

const router = Router();

router.post("/", createComment);
router.get("/", getComments);
router.delete("/:id", deleteComment);
router.put("/:id", updateComment);

export default router;