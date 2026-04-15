"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function UserProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const userQuery = trpc.user.byId.useQuery({ id }, { enabled: !!id });
  const languagesQuery = trpc.language.list.useQuery();
  const snippetsQuery = trpc.snippet.list.useQuery(
    { authorId: id, page: 1, pageSize: 20 },
    { enabled: !!id }
  );
  const activityQuery = trpc.activity.byUser.useQuery(
    { userId: id, page: 1, pageSize: 10 },
    { enabled: !!id }
  );

  if (!id) {
    return <p>Некорректный идентификатор</p>;
  }

  if (userQuery.isLoading) {
    return <p>Загрузка...</p>;
  }

  if (!userQuery.data) {
    return <p>Пользователь не найден</p>;
  }

  const avatarUrl = "avatarUrl" in userQuery.data ? userQuery.data.avatarUrl : undefined;
  const username =
    "username" in userQuery.data ? userQuery.data.username : "Пользователь";
  const languageById = new Map(
    (languagesQuery.data ?? []).map((language) => [language.id, language.name])
  );

  return (
    <section className="stack">
      <div className="card">
        <h2>Профиль пользователя</h2>
        <div className="profile-info">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} />
            ) : (
              <span>{username.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="stack">
            <p>Username: {username}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <h3>Сниппеты</h3>
        </div>
        {(snippetsQuery.data ?? []).length === 0 ? (
          <p className="muted">Пока нет сниппетов.</p>
        ) : (
          <div className="grid">
            {snippetsQuery.data?.map((snippet) => (
              <Link key={snippet.id} href={`/snippets/${snippet.id}`} className="card snippet-tile">
                <h4>{snippet.title}</h4>
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
                          d="M12 21.2c-.3 0-.6-.1-.8-.3l-7.2-6.7A5.3 5.3 0 0 1 3.2 7a5.2 5.2 0 0 1 9-2.6A5.2 5.2 0 0 1 21.8 7a5.3 5.3 0 0 1-1.8 7.2l-7.2 6.7c-.2.2-.5.3-.8.3z"
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
        )}
      </div>

      <div className="card">
        <h3>Активность</h3>
        {(activityQuery.data ?? []).length === 0 ? (
          <p className="muted">Пока нет активности.</p>
        ) : (
          <div className="stack">
            {activityQuery.data?.map((item) => (
              <div key={item.id}>
                <strong>{item.action ?? item.type}</strong>
                {item.targetType === "snippet" && item.targetId ? (
                  <p>
                    Сниппет:{" "}
                    <Link href={`/snippets/${item.targetId}`}>
                      {item.targetTitle ?? "Удалённый сниппет"}
                    </Link>
                  </p>
                ) : null}
                {item.targetType === "collection" ? (
                  <p>Коллекция: {item.targetTitle ?? "Удалённая коллекция"}</p>
                ) : null}
                {item.targetType === "comment" ? (
                  <p>
                    К сниппету:{" "}
                    {item.targetId ? (
                      <Link href={`/snippets/${item.targetId}`}>
                        {item.targetTitle ?? "Удалённый сниппет"}
                      </Link>
                    ) : (
                      "Удалённый сниппет"
                    )}
                  </p>
                ) : null}
                {item.commentText ? <p className="muted">«{item.commentText}»</p> : null}
                <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
