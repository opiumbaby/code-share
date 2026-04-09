import { z } from "zod";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import {
  activities,
  collectionSnippets,
  collections,
  comments,
  favorites,
  snippetTags,
  snippets,
  tags,
  users,
} from "../db/schema";

async function recalcTagUsage(tx: any, tagId: string) {
  const countResult = await tx
    .select({ count: sql<number>`count(*)` })
    .from(snippetTags)
    .where(eq(snippetTags.tagId, tagId));

  const count = Number(countResult[0]?.count ?? 0);
  await tx.update(tags).set({ usageCount: count }).where(eq(tags.id, tagId));
}

async function getTableColumns(tx: any, table: string) {
  const result = await tx.execute(
    sql`select column_name from information_schema.columns where table_schema = 'public' and table_name = ${table}`
  );
  const rows = (result as any).rows ?? result ?? [];
  return new Set<string>(rows.map((row: any) => row.column_name));
}

async function deleteByColumn(
  tx: any,
  table: string,
  column: string,
  value: string | null | undefined
) {
  if (!value) return;
  const tableSql = sql.raw(`"${table}"`);
  const columnSql = sql.raw(`"${column}"`);
  await tx.execute(sql`delete from ${tableSql} where ${columnSql} = ${value}`);
}

async function deleteByUserId(tx: any, table: string, userId: string) {
  const columns = await getTableColumns(tx, table);
  if (columns.has("user_id")) {
    await deleteByColumn(tx, table, "user_id", userId);
    return;
  }
  if (columns.has("userId")) {
    await deleteByColumn(tx, table, "userId", userId);
  }
}

async function deleteAuthUser(tx: any, userId: string) {
  const columns = await getTableColumns(tx, "user");
  if (columns.has("id")) {
    await deleteByColumn(tx, "user", "id", userId);
    return;
  }
  if (columns.has("user_id")) {
    await deleteByColumn(tx, "user", "user_id", userId);
  }
}

async function deleteVerificationByEmail(tx: any, email?: string | null) {
  if (!email) return;
  const columns = await getTableColumns(tx, "verification");
  if (columns.has("identifier")) {
    await deleteByColumn(tx, "verification", "identifier", email);
  }
}

export const userRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        username: z.string().min(2).optional(),
        role: z.string().min(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email ?? ctx.user.email;
      if (!email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email is required" });
      }
      const username =
        input.username ??
        ctx.user.name ??
        email.split("@")[0] ??
        `user-${ctx.user.id.slice(0, 6)}`;

      const created = await ctx.db
        .insert(users)
        .values({
          id: ctx.user.id,
          email,
          username,
          role: input.role ?? "USER",
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email,
            username,
            role: input.role ?? "USER",
          },
        })
        .returning();
      return created[0];
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users);
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const dbUser = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return dbUser[0] ?? ctx.user;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(users).where(eq(users.id, input.id));
      return result[0] ?? null;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        email: z.string().email().optional(),
        username: z.string().min(2).optional(),
        avatarUrl: z.string().optional(),
        role: z.string().min(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of profile" });
      }

      if (input.username !== undefined) {
        const existingUsername = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.username, input.username), ne(users.id, ctx.user.id)))
          .limit(1);
        if (existingUsername.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
        }
      }

      if (input.email !== undefined) {
        const existingEmail = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.email, input.email), ne(users.id, ctx.user.id)))
          .limit(1);
        if (existingEmail.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already taken" });
        }
      }
      const updateData: {
        email?: string;
        username?: string;
        avatarUrl?: string;
        role?: string;
      } = {};

      if (input.email !== undefined) updateData.email = input.email;
      if (input.username !== undefined) updateData.username = input.username;
      if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
      if (input.role !== undefined) updateData.role = input.role;

      if (Object.keys(updateData).length === 0) {
        const existing = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, input.id))
          .limit(1);
        return existing[0] ?? null;
      }

      const updated = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.id))
        .returning();
      return updated[0] ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not owner of profile" });
      }
      return ctx.db.transaction(async (tx) => {
        const snippetRows = await tx
          .select({ id: snippets.id })
          .from(snippets)
          .where(eq(snippets.authorId, input.id));
        const snippetIds = snippetRows.map((row) => row.id);

        const collectionRows = await tx
          .select({ id: collections.id })
          .from(collections)
          .where(eq(collections.ownerId, input.id));
        const collectionIds = collectionRows.map((row) => row.id);

        const tagRows =
          snippetIds.length > 0
            ? await tx
                .select({ tagId: snippetTags.tagId })
                .from(snippetTags)
                .where(inArray(snippetTags.snippetId, snippetIds))
            : [];
        const tagIds = Array.from(new Set(tagRows.map((row) => row.tagId)));

        if (collectionIds.length > 0) {
          await tx
            .delete(collectionSnippets)
            .where(inArray(collectionSnippets.collectionId, collectionIds));
        }

        if (snippetIds.length > 0) {
          await tx
            .delete(collectionSnippets)
            .where(inArray(collectionSnippets.snippetId, snippetIds));
          await tx
            .delete(snippetTags)
            .where(inArray(snippetTags.snippetId, snippetIds));
          await tx.delete(comments).where(inArray(comments.snippetId, snippetIds));
          await tx.delete(favorites).where(inArray(favorites.snippetId, snippetIds));
        }

        await tx.delete(comments).where(eq(comments.authorId, input.id));
        await tx.delete(favorites).where(eq(favorites.userId, input.id));
        await tx.delete(activities).where(eq(activities.userId, input.id));

        if (snippetIds.length > 0) {
          await tx.delete(snippets).where(inArray(snippets.id, snippetIds));
        }

        await tx.delete(collections).where(eq(collections.ownerId, input.id));
        await tx.delete(users).where(eq(users.id, input.id));

        await deleteByUserId(tx, "session", input.id);
        await deleteByUserId(tx, "account", input.id);
        await deleteVerificationByEmail(tx, ctx.user.email);
        await deleteAuthUser(tx, input.id);

        for (const tagId of tagIds) {
          await recalcTagUsage(tx, tagId);
        }

        return { success: true };
      });
    }),
});
