import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { activities, collections, comments, snippets } from "../db/schema";

async function hydrateActivities(ctx: any, rows: typeof activities.$inferSelect[]) {
  const labelByType: Record<string, string> = {
    snippet_created: "Создал сниппет",
    favorite_added: "Добавил в избранное",
    comment_added: "Оставил комментарий",
    collection_updated: "Создал коллекцию",
  };

  return Promise.all(
    rows.map(async (item) => {
      let targetType: "snippet" | "collection" | "comment" | null = null;
      let targetId: string | null = null;
      let targetTitle: string | null = null;
      let commentText: string | null = null;

      if (item.type === "snippet_created" || item.type === "favorite_added") {
        targetType = "snippet";
        targetId = item.entityId;
        const snippetRow = await ctx.db
          .select({ title: snippets.title })
          .from(snippets)
          .where(eq(snippets.id, item.entityId))
          .limit(1);
        targetTitle = snippetRow[0]?.title ?? null;
      }

      if (item.type === "collection_updated") {
        targetType = "collection";
        targetId = item.entityId;
        const collectionRow = await ctx.db
          .select({ name: collections.name })
          .from(collections)
          .where(eq(collections.id, item.entityId))
          .limit(1);
        targetTitle = collectionRow[0]?.name ?? null;
      }

      if (item.type === "comment_added") {
        targetType = "comment";
        targetId = item.entityId;
        const commentRow = await ctx.db
          .select({
            text: comments.text,
            snippetId: comments.snippetId,
            snippetTitle: snippets.title,
          })
          .from(comments)
          .leftJoin(snippets, eq(comments.snippetId, snippets.id))
          .where(eq(comments.id, item.entityId))
          .limit(1);
        commentText = commentRow[0]?.text ?? null;
        targetTitle = commentRow[0]?.snippetTitle ?? null;
        targetId = commentRow[0]?.snippetId ?? item.entityId;
      }

      return {
        ...item,
        action: labelByType[item.type] ?? item.type,
        targetType,
        targetId,
        targetTitle,
        commentText,
      };
    })
  );
}

export const activityRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;

      const rows = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.userId, ctx.user.id))
        .orderBy(desc(activities.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      return hydrateActivities(ctx, rows);
    }),
  byUser: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;

      const rows = await ctx.db
        .select()
        .from(activities)
        .where(eq(activities.userId, input.userId))
        .orderBy(desc(activities.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return hydrateActivities(ctx, rows);
    }),
});
