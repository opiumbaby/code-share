import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  const email =
    ctx.user.email ?? (ctx.user.id ? `${ctx.user.id}@local` : undefined);
  const baseUsername =
    ctx.user.name ??
    (email ? email.split("@")[0] : undefined) ??
    `user-${ctx.user.id.slice(0, 6)}`;

  if (!email) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "User email is missing" });
  }

  const existingUser = await ctx.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, ctx.user.id))
    .limit(1);

  if (existingUser.length === 0) {
    let username = baseUsername;
    const existingByUsername = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, baseUsername))
      .limit(1);

    if (existingByUsername.length > 0 && existingByUsername[0].id !== ctx.user.id) {
      username = `${baseUsername}-${ctx.user.id.slice(0, 6)}`;
    }

    await ctx.db.insert(users).values({
      id: ctx.user.id,
      email,
      username,
      role: "USER",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
