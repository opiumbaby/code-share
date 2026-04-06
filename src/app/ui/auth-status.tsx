"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function AuthStatus() {
  const { data: session, isPending } = authClient.useSession();
  const meQuery = trpc.user.me.useQuery(undefined, { enabled: !!session?.user });

  if (isPending) {
    return <p>Проверка сессии...</p>;
  }

  if (!session?.user) {
    return (
      <div className="row auth-status">
        <Link className="chip" href="/auth/signin">
          Sign in
        </Link>
        <Link className="chip accent" href="/auth/signup">
          Sign up
        </Link>
      </div>
    );
  }

  const label =
    ("username" in (meQuery.data ?? {}) && meQuery.data?.username) ||
    ("email" in (meQuery.data ?? {}) && meQuery.data?.email) ||
    session.user.email ||
    session.user.name ||
    "Пользователь";
  const avatarUrl =
    "avatarUrl" in (meQuery.data ?? {}) ? meQuery.data?.avatarUrl : undefined;

  return (
    <div className="row auth-status">
      <Link className="chip profile-chip" href="/profile">
        <span className="avatar">
          {avatarUrl ? <img src={avatarUrl} alt={label} /> : label.slice(0, 1).toUpperCase()}
        </span>
        {label}
      </Link>
      <button className="secondary" onClick={() => authClient.signOut()}>
        Выйти
      </button>
    </div>
  );
}
