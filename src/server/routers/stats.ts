import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../trpc/trpc";
import { snippetTags, snippets, tags } from "../db/schema";

export const statsRouter = router({
  snippets: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      return ctx.db
        .select()
        .from(snippets)
        .orderBy(desc(snippets.views))
        .limit(limit);
    }),

  tags: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const usageCount = sql<number>`count(${snippetTags.snippetId})`;

      return ctx.db
        .select({
          id: tags.id,
          name: tags.name,
          usageCount,
        })
        .from(tags)
        .innerJoin(snippetTags, eq(snippetTags.tagId, tags.id))
        .groupBy(tags.id, tags.name)
        .orderBy(desc(usageCount), tags.name)
        .limit(limit);
    }),
});
