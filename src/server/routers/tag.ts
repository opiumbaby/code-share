import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { snippetTags, tags } from "../db/schema";

export const tagRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.insert(tags).values({ name: input.name }).returning();
      return created[0];
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(tags);
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(tags).where(eq(tags.id, input.id));
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(tags)
        .set({ name: input.name })
        .where(eq(tags.id, input.id))
        .returning();
      return updated[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(snippetTags)
        .where(eq(snippetTags.tagId, input.id));

      const count = Number(countResult[0]?.count ?? 0);
      if (count > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Tag is used by existing snippets",
        });
      }

      await ctx.db.delete(tags).where(eq(tags.id, input.id));
      return { success: true };
    }),
});
