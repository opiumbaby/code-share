import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { collections, comments, snippets, users } from "../db/schema";

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

      const snippetCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(snippets)
        .where(eq(snippets.authorId, input.id));
      const commentCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.authorId, input.id));
      const collectionCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(collections)
        .where(eq(collections.ownerId, input.id));

      const total =
        Number(snippetCount[0]?.count ?? 0) +
        Number(commentCount[0]?.count ?? 0) +
        Number(collectionCount[0]?.count ?? 0);

      if (total > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User has related data. Delete snippets/comments/collections first.",
        });
      }

      await ctx.db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
});
