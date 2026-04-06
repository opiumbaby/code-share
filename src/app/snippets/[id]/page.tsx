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
        <p>Просмотры: {snippetQuery.data.views}</p>
        <p>Избранное: {snippetQuery.data.favoritesCount}</p>
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
