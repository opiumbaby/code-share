"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import CommentForm from "./components/comment-form";
import CommentItem from "./components/comment-item";
import FavoriteButton from "./components/favorite-button";

export default function SnippetDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const snippetQuery = trpc.snippet.byId.useQuery({ id }, { enabled: !!id });
  const commentsQuery = trpc.comment.list.useQuery({ snippetId: id }, { enabled: !!id });
  const meQuery = trpc.user.me.useQuery();
  const authorQuery = trpc.user.byId.useQuery(
    { id: snippetQuery.data?.authorId ?? "" },
    { enabled: !!snippetQuery.data?.authorId }
  );
  const deleteMutation = trpc.snippet.delete.useMutation();

  if (!id) {
    return <p>Некорректный идентификатор</p>;
  }

  if (snippetQuery.isLoading) {
    return <p>Загрузка...</p>;
  }

  if (!snippetQuery.data) {
    return <p>Сниппет не найден</p>;
  }

  return (
    <section className="stack">
      <div className="card">
        <h2>{snippetQuery.data.title}</h2>
        <div className="snippet-author">
          <span className="muted">Автор</span>
          {snippetQuery.data.authorId ? (
            <Link href={`/users/${snippetQuery.data.authorId}`} className="author-chip">
              <span className="author-avatar">
                {authorQuery.data?.avatarUrl ? (
                  <img src={authorQuery.data.avatarUrl} alt={authorQuery.data?.username ?? "Автор"} />
                ) : (
                  (authorQuery.data?.username ?? "П").slice(0, 1).toUpperCase()
                )}
              </span>
              <span>{authorQuery.data?.username ?? "Пользователь"}</span>
            </Link>
          ) : (
            <span className="muted">—</span>
          )}
        </div>
        <div className="row stats snippet-stats">
          <span className="stat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 5c-5.2 0-9.3 4.6-10.4 6.1a1.4 1.4 0 0 0 0 1.7C2.7 14.4 6.8 19 12 19s9.3-4.6 10.4-6.2a1.4 1.4 0 0 0 0-1.7C21.3 9.6 17.2 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                fill="currentColor"
              />
            </svg>
            {snippetQuery.data.views}
          </span>
          <span className="stat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 21.2c-.3 0-.6-.1-.8-.3l-7.2-6.7A5.3 5.3 0 0 1 3.2 7a5.2 5.2 0 0 1 9-2.6A5.2 5.2 0 0 1 21.8 7a5.3 5.3 0 0 1-1.8 7.2l-7.2 6.7c-.2.2-.5.3-.8.3z"
                fill="currentColor"
              />
            </svg>
            {snippetQuery.data.favoritesCount}
          </span>
        </div>
        <FavoriteButton snippetId={id} />
        {meQuery.data?.id === snippetQuery.data.authorId && (
          <div className="row">
            <Link href={`/snippets/${id}/edit`}>Редактировать</Link>
            <button
              className="secondary"
              onClick={async () => {
                await deleteMutation.mutateAsync({ id });
              }}
            >
              Удалить сниппет
            </button>
          </div>
        )}
        <code>{snippetQuery.data.code}</code>
      </div>

      <div className="card">
        <h3>Комментарии</h3>
        {meQuery.data ? (
          <CommentForm snippetId={id} onCreated={() => commentsQuery.refetch()} />
        ) : (
          <p>Войдите, чтобы комментировать</p>
        )}
        {commentsQuery.data?.length ? (
          <ul>
            {commentsQuery.data.map((comment) => (
              <CommentItem
                key={comment.id}
                id={comment.id}
                text={comment.text}
                authorId={comment.authorId}
                author={comment.authorName ?? "Пользователь"}
                avatarUrl={comment.authorAvatarUrl ?? null}
                createdAt={comment.createdAt}
                isSnippetAuthor={comment.authorId === snippetQuery.data.authorId}
                canEdit={meQuery.data?.id === comment.authorId}
                onChanged={() => commentsQuery.refetch()}
              />
            ))}
          </ul>
        ) : (
          <p>Комментариев пока нет</p>
        )}
      </div>
    </section>
  );
}
