import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";

export async function createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return {
    db,
    req,
    resHeaders,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
