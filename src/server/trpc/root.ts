import { router } from "./trpc";
import { activityRouter } from "../routers/activity";
import { collectionRouter } from "../routers/collection";
import { commentRouter } from "../routers/comment";
import { favoriteRouter } from "../routers/favorite";
import { languageRouter } from "../routers/language";
import { snippetRouter } from "../routers/snippet";
import { statsRouter } from "../routers/stats";
import { tagRouter } from "../routers/tag";
import { userRouter } from "../routers/user";

export const appRouter = router({
  activity: activityRouter,
  collection: collectionRouter,
  comment: commentRouter,
  favorite: favoriteRouter,
  language: languageRouter,
  snippet: snippetRouter,
  stats: statsRouter,
  tag: tagRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
