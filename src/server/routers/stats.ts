import { z } from "zod";
import { desc } from "drizzle-orm";
import { publicProcedure, router } from "../trpc/trpc";
import { snippets, tags } from "../db/schema";

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
      return ctx.db.select().from(tags).orderBy(desc(tags.usageCount)).limit(limit);
    }),
});
