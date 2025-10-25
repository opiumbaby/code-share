import { Router } from "express";
import { createCollection, getCollections } from "../controllers/collectionController";

const router = Router();

router.post("/", createCollection);  // Создать коллекцию
router.get("/", getCollections);     // Получить все коллекции (опционально фильтр по ownerId)

export default router;
