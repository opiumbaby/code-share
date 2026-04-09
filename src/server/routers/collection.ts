import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { activities, collectionSnippets, collections, snippets } from "../db/schema";

async function ensureOwnedSnippets(
  tx: any,
  userId: string,
  snippetIds: string[] | undefined
) {
  const ids = Array.from(new Set(snippetIds ?? []));
  if (ids.length === 0) {
    return;
  }

  const countResult = await tx
    .select({ count: sql<number>`count(*)` })
    .from(snippets)
    .where(and(inArray(snippets.id, ids), eq(snippets.authorId, userId)));

  const count = Number(countResult[0]?.count ?? 0);
  if (count !== ids.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Можно добавлять только свои сниппеты",
    });
  }
}

export const collectionRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        snippetIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        await ensureOwnedSnippets(tx, ctx.user.id, input.snippetIds);

        const created = await tx
          .insert(collections)
          .values({ name: input.name, ownerId: ctx.user.id, createdAt: new Date() })
          .returning();

        const collection = created[0];
        for (const snippetId of input.snippetIds ?? []) {
          await tx.insert(collectionSnippets).values({
            collectionId: collection.id,
            snippetId,
          });
        }

        await tx.insert(activities).values({
          userId: ctx.user.id,
          type: "collection_updated",
          entityId: collection.id,
        });

        return collection;
      });
    }),

  list: publicProcedure
    .input(z.object({ ownerId: z.string().min(1).optional() }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select({
          id: collections.id,
          name: collections.name,
          ownerId: collections.ownerId,
          createdAt: collections.createdAt,
          snippetsCount: sql<number>`count(${collectionSnippets.snippetId})`,
        })
        .from(collections)
        .leftJoin(collectionSnippets, eq(collectionSnippets.collectionId, collections.id))
        .groupBy(collections.id)
        .orderBy(collections.createdAt);

      if (input?.ownerId) {
        query = query.where(eq(collections.ownerId, input.ownerId));
      }

      return query;
    }),

  snippets: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: snippets.id,
          title: snippets.title,
          authorId: snippets.authorId,
          languageId: snippets.languageId,
        })
        .from(collectionSnippets)
        .innerJoin(snippets, eq(collectionSnippets.snippetId, snippets.id))
        .where(eq(collectionSnippets.collectionId, input.id))
        .orderBy(snippets.createdAt);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(collections).where(eq(collections.id, input.id));
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        snippetIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const existing = await tx
          .select({ ownerId: collections.ownerId })
          .from(collections)
          .where(eq(collections.id, input.id))
          .limit(1);

        if (existing.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
        }

        if (existing[0].ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of collection" });
        }

        if (input.snippetIds) {
          await ensureOwnedSnippets(tx, ctx.user.id, input.snippetIds);
        }

        const updateValues: Partial<typeof collections.$inferInsert> = {};
        if (typeof input.name !== "undefined") {
          updateValues.name = input.name;
        }

        const updated =
          Object.keys(updateValues).length > 0
            ? await tx
                .update(collections)
                .set(updateValues)
                .where(eq(collections.id, input.id))
                .returning()
            : await tx.select().from(collections).where(eq(collections.id, input.id));

        if (input.snippetIds) {
          await tx.delete(collectionSnippets).where(eq(collectionSnippets.collectionId, input.id));
          for (const snippetId of input.snippetIds) {
            await tx.insert(collectionSnippets).values({
              collectionId: input.id,
              snippetId,
            });
          }
        }

        return updated[0] ?? null;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ ownerId: collections.ownerId })
        .from(collections)
        .where(eq(collections.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      if (existing[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of collection" });
      }

      await ctx.db.delete(collectionSnippets).where(eq(collectionSnippets.collectionId, input.id));
      await ctx.db.delete(collections).where(eq(collections.id, input.id));
      return { success: true };
    }),
});
