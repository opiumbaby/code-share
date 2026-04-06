import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { activities, comments, users } from "../db/schema";

export const commentRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        snippetId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db
        .insert(comments)
        .values({
          text: input.text,
          authorId: ctx.user.id,
          snippetId: input.snippetId,
        })
        .returning();

      await ctx.db.insert(activities).values({
        userId: ctx.user.id,
        type: "comment_added",
        entityId: created[0].id,
      });

      return created[0];
    }),

  list: publicProcedure
    .input(z.object({ snippetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: comments.id,
          text: comments.text,
          authorId: comments.authorId,
          createdAt: comments.createdAt,
          authorName: users.username,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.snippetId, input.snippetId))
        .orderBy(desc(comments.createdAt));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(comments).where(eq(comments.id, input.id));
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ authorId: comments.authorId })
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      }

      if (existing[0].authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of comment" });
      }

      const updated = await ctx.db
        .update(comments)
        .set({ text: input.text })
        .where(eq(comments.id, input.id))
        .returning();

      return updated[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ authorId: comments.authorId })
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      }

      if (existing[0].authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of comment" });
      }

      await ctx.db.delete(comments).where(eq(comments.id, input.id));
      return { success: true };
    }),
});
