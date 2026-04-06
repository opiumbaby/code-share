import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc/trpc";
import { activities, favorites, snippets } from "../db/schema";

export const favoriteRouter = router({
  add: protectedProcedure
    .input(z.object({ snippetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const inserted = await tx
          .insert(favorites)
          .values({ userId: ctx.user.id, snippetId: input.snippetId })
          .onConflictDoNothing()
          .returning({ id: favorites.id });

        if (inserted.length > 0) {
          await tx
            .update(snippets)
            .set({ favoritesCount: sql`${snippets.favoritesCount} + 1` })
            .where(eq(snippets.id, input.snippetId));

          await tx.insert(activities).values({
            userId: ctx.user.id,
            type: "favorite_added",
            entityId: input.snippetId,
          });
        }

        return { success: true };
      });
    }),

  remove: protectedProcedure
    .input(z.object({ snippetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const deleted = await tx
          .delete(favorites)
          .where(and(eq(favorites.userId, ctx.user.id), eq(favorites.snippetId, input.snippetId)))
          .returning({ id: favorites.id });

        if (deleted.length > 0) {
          await tx
            .update(snippets)
            .set({ favoritesCount: sql`greatest(${snippets.favoritesCount} - 1, 0)` })
            .where(eq(snippets.id, input.snippetId));
        }

        return { success: true };
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.select().from(favorites).where(eq(favorites.userId, ctx.user.id));
    }),

  listDetailed: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: favorites.id,
          snippetId: favorites.snippetId,
          createdAt: favorites.createdAt,
          snippetTitle: snippets.title,
        })
        .from(favorites)
        .leftJoin(snippets, eq(favorites.snippetId, snippets.id))
        .where(eq(favorites.userId, ctx.user.id))
        .orderBy(desc(favorites.createdAt))
        .limit(input?.limit ?? 100);
    }),
});
