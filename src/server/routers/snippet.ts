import { z } from "zod";
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import {
  activities,
  collectionSnippets,
  comments,
  favorites,
  snippetTags,
  snippets,
  tags,
} from "../db/schema";

const createSnippetSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  languageId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

const updateSnippetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  languageId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

const listSchema = z.object({
  tag: z.string().min(1).optional(),
  languageId: z.string().uuid().optional(),
  authorId: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  sort: z.enum(["new", "popular"]).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

async function ensureTagId(tx: any, name: string) {
  const existing = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, name))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const created = await tx
    .insert(tags)
    .values({ name, usageCount: 0 })
    .returning({ id: tags.id });

  return created[0].id;
}

async function recalcTagUsage(tx: any, tagId: string) {
  const countResult = await tx
    .select({ count: sql<number>`count(*)` })
    .from(snippetTags)
    .where(eq(snippetTags.tagId, tagId));

  const count = Number(countResult[0]?.count ?? 0);

  await tx.update(tags).set({ usageCount: count }).where(eq(tags.id, tagId));
}

export const snippetRouter = router({
  mine: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 200;

      const rows = await ctx.db
        .select({
          id: snippets.id,
          title: snippets.title,
          code: snippets.code,
          languageId: snippets.languageId,
          authorId: snippets.authorId,
          views: snippets.views,
          favoritesCount: snippets.favoritesCount,
          createdAt: snippets.createdAt,
          updatedAt: snippets.updatedAt,
        })
        .from(snippets)
        .where(or(eq(snippets.authorId, ctx.user.id), isNull(snippets.authorId)))
        .orderBy(desc(snippets.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const orphanIds = rows.filter((row) => !row.authorId).map((row) => row.id);
      if (orphanIds.length > 0) {
        await ctx.db
          .update(snippets)
          .set({ authorId: ctx.user.id })
          .where(inArray(snippets.id, orphanIds));
      }

      return rows.map((row) => ({ ...row, authorId: ctx.user.id }));
    }),
  create: protectedProcedure.input(createSnippetSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const now = new Date();
      const created = await tx
        .insert(snippets)
        .values({
          title: input.title,
          code: input.code,
          languageId: input.languageId,
          authorId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const snippet = created[0];

      const tagIds: string[] = [];
      for (const tagName of input.tags ?? []) {
        const tagId = await ensureTagId(tx, tagName);
        tagIds.push(tagId);
        await tx.insert(snippetTags).values({ snippetId: snippet.id, tagId });
      }

      for (const tagId of tagIds) {
        await recalcTagUsage(tx, tagId);
      }

      await tx.insert(activities).values({
        userId: ctx.user.id,
        type: "snippet_created",
        entityId: snippet.id,
      });

      return snippet;
    });
  }),

  list: publicProcedure.input(listSchema.optional()).query(async ({ ctx, input }) => {
    const page = input?.page ?? 1;
    const pageSize = input?.pageSize ?? 20;

    const conditions = [];

    if (input?.languageId) {
      conditions.push(eq(snippets.languageId, input.languageId));
    }

    if (input?.authorId) {
      conditions.push(eq(snippets.authorId, input.authorId));
    }

    if (input?.query) {
      conditions.push(
        or(
          ilike(snippets.title, `%${input.query}%`),
          ilike(snippets.code, `%${input.query}%`)
        )
      );
    }

    let query = ctx.db
      .selectDistinct({
        id: snippets.id,
        title: snippets.title,
        code: snippets.code,
        languageId: snippets.languageId,
        authorId: snippets.authorId,
        views: snippets.views,
        favoritesCount: snippets.favoritesCount,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
      })
      .from(snippets);

    if (input?.tag) {
      query = query
        .innerJoin(snippetTags, eq(snippetTags.snippetId, snippets.id))
        .innerJoin(tags, eq(snippetTags.tagId, tags.id))
        .where(and(eq(tags.name, input.tag), ...conditions));
    } else if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (input?.sort === "popular") {
      query = query.orderBy(desc(snippets.favoritesCount));
    } else {
      query = query.orderBy(desc(snippets.createdAt));
    }

    return query.limit(pageSize).offset((page - 1) * pageSize);
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid(), incrementViews: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.incrementViews ?? true) {
        await ctx.db
          .update(snippets)
          .set({ views: sql`${snippets.views} + 1` })
          .where(eq(snippets.id, input.id));
      }

      const result = await ctx.db.select().from(snippets).where(eq(snippets.id, input.id));
      return result[0] ?? null;
    }),

  tags: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ name: tags.name })
        .from(snippetTags)
        .innerJoin(tags, eq(snippetTags.tagId, tags.id))
        .where(eq(snippetTags.snippetId, input.id));
      return result.map((item) => item.name);
    }),

  update: protectedProcedure.input(updateSnippetSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const existing = await tx
        .select({ authorId: snippets.authorId })
        .from(snippets)
        .where(eq(snippets.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snippet not found" });
      }

      if (existing[0].authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of snippet" });
      }

      const now = new Date();
      const updated = await tx
        .update(snippets)
        .set({
          title: input.title,
          code: input.code,
          languageId: input.languageId,
          updatedAt: now,
        })
        .where(eq(snippets.id, input.id))
        .returning();

      if (input.tags) {
        const existingTagIds = await tx
          .select({ tagId: snippetTags.tagId })
          .from(snippetTags)
          .where(eq(snippetTags.snippetId, input.id));

        await tx.delete(snippetTags).where(eq(snippetTags.snippetId, input.id));

        const newTagIds: string[] = [];
        for (const tagName of input.tags) {
          const tagId = await ensureTagId(tx, tagName);
          newTagIds.push(tagId);
          await tx.insert(snippetTags).values({ snippetId: input.id, tagId });
        }

        const affected = new Set([
          ...existingTagIds.map((item) => item.tagId),
          ...newTagIds,
        ]);

        for (const tagId of affected) {
          await recalcTagUsage(tx, tagId);
        }
      }

      return updated[0] ?? null;
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const existing = await tx
        .select({ authorId: snippets.authorId })
        .from(snippets)
        .where(eq(snippets.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snippet not found" });
      }

      if (existing[0].authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of snippet" });
      }

      const tagIds = await tx
        .select({ tagId: snippetTags.tagId })
        .from(snippetTags)
        .where(eq(snippetTags.snippetId, input.id));

      await tx.delete(snippetTags).where(eq(snippetTags.snippetId, input.id));
      await tx.delete(comments).where(eq(comments.snippetId, input.id));
      await tx.delete(favorites).where(eq(favorites.snippetId, input.id));
      await tx.delete(collectionSnippets).where(eq(collectionSnippets.snippetId, input.id));

      await tx.delete(snippets).where(eq(snippets.id, input.id));

      for (const tagId of tagIds) {
        await recalcTagUsage(tx, tagId.tagId);
      }

      return { success: true };
    });
  }),

  export: protectedProcedure.query(async ({ ctx }) => {
      const data = await ctx.db
        .select()
        .from(snippets)
        .where(eq(snippets.authorId, ctx.user.id));
      return data;
    }),

  import: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            title: z.string().min(1),
            code: z.string().min(1),
            languageId: z.string().uuid().optional(),
            tags: z.array(z.string().min(1)).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const inserted = [];

        for (const item of input.items) {
          const now = new Date();
          const created = await tx
            .insert(snippets)
            .values({
              title: item.title,
              code: item.code,
              languageId: item.languageId,
              authorId: ctx.user.id,
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          const snippet = created[0];
          const tagIds: string[] = [];
          for (const tagName of item.tags ?? []) {
            const tagId = await ensureTagId(tx, tagName);
            tagIds.push(tagId);
            await tx.insert(snippetTags).values({ snippetId: snippet.id, tagId });
          }
          for (const tagId of tagIds) {
            await recalcTagUsage(tx, tagId);
          }

          inserted.push(snippet);
        }

        return inserted;
      });
    }),
});
