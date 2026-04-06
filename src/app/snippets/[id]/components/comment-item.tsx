"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function CommentItem({
  id,
  text,
  authorId,
  author,
  avatarUrl,
  createdAt,
  isSnippetAuthor,
  canEdit,
  onChanged,
}: {
  id: string;
  text: string;
  authorId?: string | null;
  author: string;
  avatarUrl?: string | null;
  createdAt: string | Date;
  isSnippetAuthor: boolean;
  canEdit: boolean;
  onChanged?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const updateMutation = trpc.comment.update.useMutation();
  const deleteMutation = trpc.comment.delete.useMutation();

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, text: draft.trim() });
    setIsEditing(false);
    onChanged?.();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id });
    onChanged?.();
  };

  return (
    <li className="comment">
      {isEditing ? (
        <div className="stack">
          <textarea
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="row">
            <button onClick={handleSave} disabled={updateMutation.isPending}>
              Сохранить
            </button>
            <button className="secondary" onClick={() => setIsEditing(false)}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="comment-header">
            {authorId ? (
              <Link href={`/users/${authorId}`} className="comment-avatar">
                {avatarUrl ? <img src={avatarUrl} alt={author} /> : author.slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <div className="comment-avatar">
                {avatarUrl ? <img src={avatarUrl} alt={author} /> : author.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="comment-meta">
              <div className="row">
                {authorId ? (
                  <Link href={`/users/${authorId}`} className="comment-author">
                    <strong>{author}</strong>
                  </Link>
                ) : (
                  <strong>{author}</strong>
                )}
                {isSnippetAuthor && <span className="chip accent">Автор</span>}
              </div>
              <span className="muted">
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
            {canEdit && (
              <div className="row comment-actions">
                <button className="secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </button>
                <button className="secondary" onClick={handleDelete}>
                  Удалить
                </button>
              </div>
            )}
          </div>
          <p className="comment-text">{text}</p>
        </>
      )}
      {(updateMutation.isError || deleteMutation.isError) && <p>Ошибка операции</p>}
    </li>
  );
}
