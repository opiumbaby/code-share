"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function ProfilePage() {
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const userQuery = trpc.user.me.useQuery();
  const userId = userQuery.data?.id ?? "";
  const snippetsQuery = trpc.snippet.list.useQuery(
    { authorId: userId, page: 1, pageSize: 5 },
    { enabled: userId.length > 0 }
  );
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => userQuery.refetch(),
  });
  const favoritesQuery = trpc.favorite.listDetailed.useQuery(
    { limit: 5 },
    { enabled: !!userId }
  );
  const activityQuery = trpc.activity.list.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: !!userId }
  );
  const avatarUrl =
    "avatarUrl" in (userQuery.data ?? {}) ? userQuery.data?.avatarUrl : undefined;

  return (
    <section className="stack">
      <div className="card">
        <h2>Профиль</h2>
        <button className="secondary" onClick={() => userQuery.refetch()}>
          Обновить
        </button>
        {userQuery.isError && <p>Требуется авторизация</p>}
        {userQuery.data && (
          <div className="profile-info">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" />
              ) : (
                <span>
                  {"username" in userQuery.data
                    ? userQuery.data.username?.slice(0, 1).toUpperCase()
                    : "U"}
                </span>
              )}
            </div>
            <div className="stack">
              <p>Email: {"email" in userQuery.data ? userQuery.data.email : "—"}</p>
              <p>
                Username:{" "}
                {"username" in userQuery.data
                  ? userQuery.data.username
                  : "name" in userQuery.data
                  ? userQuery.data.name
                  : "—"}
              </p>
              <p>Role: {"role" in userQuery.data ? userQuery.data.role : "USER"}</p>
              <div className="stack">
                <label className="muted">Аватар</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 512 * 1024) {
                      setAvatarError("Файл слишком большой (макс 512KB).");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const result = reader.result?.toString();
                      if (!result) return;
                      setAvatarError("");
                      await updateMutation.mutateAsync({
                        id: userId,
                        avatarUrl: result,
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {avatarUrl ? (
                  <button
                    className="secondary"
                    type="button"
                    onClick={async () => {
                      setAvatarError("");
                      await updateMutation.mutateAsync({
                        id: userId,
                        avatarUrl: "",
                      });
                    }}
                  >
                    Удалить аватар
                  </button>
                ) : null}
                {avatarError && <p>{avatarError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Обновить профиль</h3>
        <div className="stack">
          <input
            placeholder="Новый email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <input
            placeholder="Новый username"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
          />
          <button
            onClick={() =>
              updateMutation.mutate({
                id: userId,
                email: newEmail.trim() || undefined,
                username: newUsername.trim() || undefined,
              })
            }
            disabled={!userId || updateMutation.isPending}
          >
            Сохранить
          </button>
          {updateMutation.isError && (
            <p>{updateMutation.error?.message ?? "Ошибка обновления"}</p>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="row">
            <h3>Мои сниппеты</h3>
            <Link className="chip" href="/my-snippets">
              Смотреть все
            </Link>
          </div>
          <div className="stack">
            {snippetsQuery.data?.map((snippet) => (
              <div key={snippet.id}>
                <Link href={`/snippets/${snippet.id}`}>{snippet.title}</Link>
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
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="row">
            <h3>Избранное</h3>
            <Link className="chip" href="/favorites">
              Смотреть все
            </Link>
          </div>
          <div className="stack">
            {favoritesQuery.data?.map((favorite) => {
              const title = favorite.snippetTitle ?? "Сниппет удалён";
              return (
                <div key={favorite.id}>
                  {favorite.snippetTitle ? (
                    <Link href={`/snippets/${favorite.snippetId}`}>{title}</Link>
                  ) : (
                    <strong>{title}</strong>
                  )}
                  <p className="muted">
                    Добавлено: {new Date(favorite.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <h3>Активность</h3>
          <Link className="chip" href="/activity">
            Смотреть все
          </Link>
        </div>
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
      </div>
    </section>
  );
}
