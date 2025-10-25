import { Router } from "express";
import { createUser, getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController";

const router = Router();

router.post("/", createUser);           // Создать пользователя
router.get("/", getUsers);              // Все пользователи
router.get("/:id", getUserById);        // Один пользователь по id
router.put("/:id", updateUser);         // Обновить пользователя
router.delete("/:id", deleteUser);      // Удалить пользователя

export default router;
