import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { languages, snippets } from "../db/schema";

export const languageRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), fileExtension: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.insert(languages).values(input).returning();
      return created[0];
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(languages);
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(languages).where(eq(languages.id, input.id));
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        fileExtension: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(languages)
        .set({ name: input.name, fileExtension: input.fileExtension })
        .where(eq(languages.id, input.id))
        .returning();
      return updated[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(snippets)
        .where(eq(snippets.languageId, input.id));

      const count = Number(countResult[0]?.count ?? 0);
      if (count > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Language is used by existing snippets",
        });
      }

      await ctx.db.delete(languages).where(eq(languages.id, input.id));
      return { success: true };
    }),
});
