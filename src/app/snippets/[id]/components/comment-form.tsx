"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CommentForm({
  snippetId,
  onCreated,
}: {
  snippetId: string;
  onCreated?: () => void;
}) {
  const [text, setText] = useState("");
  const commentMutation = trpc.comment.create.useMutation();

  const handleSubmit = async () => {
    if (!text.trim()) {
      return;
    }
    await commentMutation.mutateAsync({ snippetId, text: text.trim() });
    setText("");
    onCreated?.();
  };

  return (
    <div className="stack">
      <textarea
        rows={3}
        placeholder="Оставьте комментарий"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button onClick={handleSubmit} disabled={commentMutation.isPending}>
        Отправить
      </button>
      {commentMutation.isError && <p>Нужна авторизация</p>}
    </div>
  );
}
