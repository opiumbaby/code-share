import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import snippetRoutes from "./routes/snippetRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import commentRoutes from "./routes/commentRoutes";
import tagRoutes from "./routes/tagRoutes";
import languageRoutes from "./routes/languageRoutes";

dotenv.config();
const app = express();
app.use(express.json());

// Подключение всех маршрутов
app.use("/api/users", userRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/languages", languageRoutes);

app.get("/", (_req, res) => res.send("✅ Server is running!"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server ready on http://localhost:${PORT}`));
