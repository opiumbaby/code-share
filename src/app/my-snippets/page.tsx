"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function MySnippetsPage() {
  const userQuery = trpc.user.me.useQuery();
  const userId = userQuery.data?.id ?? "";
  const languagesQuery = trpc.language.list.useQuery();
  const snippetsQuery = trpc.snippet.list.useQuery(
    { authorId: userId, page: 1, pageSize: 50 },
    { enabled: userId.length > 0 }
  );

  const languageById = new Map(
    (languagesQuery.data ?? []).map((language) => [language.id, language.name])
  );

  return (
    <section className="stack">
      <div className="card">
        <h2>Мои сниппеты</h2>
        {userQuery.isError && <p>Требуется авторизация</p>}
      </div>

      <div className="grid">
        {snippetsQuery.data?.map((snippet) => (
          <Link key={snippet.id} href={`/snippets/${snippet.id}`} className="card card-link">
            <h3>{snippet.title}</h3>
            <div className="snippet-meta">
              <span className="language-chip">
                {languageById.get(snippet.languageId ?? "") ?? "—"}
              </span>
              <div className="row stats">
                <span className="stat">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 5c-5.2 0-9.3 4.6-10.4 6.1a1.4 1.4 0 0 0 0 1.7C2.7 14.4 6.8 19 12 19s9.3-4.6 10.4-6.2a1.4 1.4 0 0 0 0-1.7C21.3 9.6 17.2 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                      fill="currentColor"
                    />
                  </svg>
                  {snippet.views}
                </span>
                <span className="stat">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 20.5c-.3 0-.6-.1-.8-.3-2.2-2-5.9-5.4-7.4-7.2-1.8-2.1-1.6-5.3.5-7.1 2.2-1.9 5.4-1.6 7.2.5l.5.6.5-.6c1.8-2.1 5-2.4 7.2-.5 2.1 1.8 2.3 5 .5 7.1-1.5 1.8-5.2 5.2-7.4 7.2-.2.2-.5.3-.8.3z"
                      fill="currentColor"
                    />
                  </svg>
                  {snippet.favoritesCount}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
