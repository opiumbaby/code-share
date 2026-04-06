"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function TagsPage() {
  const tagsQuery = trpc.tag.list.useQuery();
  const createMutation = trpc.tag.create.useMutation({
    onSuccess: () => tagsQuery.refetch(),
  });
  const updateMutation = trpc.tag.update.useMutation({
    onSuccess: () => tagsQuery.refetch(),
  });
  const deleteMutation = trpc.tag.delete.useMutation({
    onSuccess: () => tagsQuery.refetch(),
  });

  const [newName, setNewName] = useState("");
  const [updateId, setUpdateId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [deleteId, setDeleteId] = useState("");

  return (
    <section className="stack">
      <div className="card">
        <h2>Теги</h2>
        <div className="stack">
          <input
            placeholder="Новый тег"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <button
            onClick={() => createMutation.mutate({ name: newName.trim() })}
            disabled={createMutation.isPending}
          >
            Создать
          </button>
          {createMutation.isError && <p>Ошибка создания или нужна авторизация</p>}
        </div>
      </div>

      <div className="card">
        <h3>Обновить тег</h3>
        <div className="stack">
          <input
            placeholder="ID тега"
            value={updateId}
            onChange={(event) => setUpdateId(event.target.value)}
          />
          <input
            placeholder="Новое имя"
            value={updateName}
            onChange={(event) => setUpdateName(event.target.value)}
          />
          <button
            onClick={() => updateMutation.mutate({ id: updateId, name: updateName.trim() })}
            disabled={updateMutation.isPending}
          >
            Обновить
          </button>
          {updateMutation.isError && <p>Ошибка обновления или нужна авторизация</p>}
        </div>
      </div>

      <div className="card">
        <h3>Удалить тег</h3>
        <div className="row">
          <input
            placeholder="ID тега"
            value={deleteId}
            onChange={(event) => setDeleteId(event.target.value)}
          />
          <button
            className="secondary"
            onClick={() => deleteMutation.mutate({ id: deleteId })}
            disabled={deleteMutation.isPending}
          >
            Удалить
          </button>
        </div>
        {deleteMutation.isError && <p>Тег используется или нужна авторизация</p>}
      </div>

      <div className="grid">
        {tagsQuery.data?.map((tag) => (
          <div key={tag.id} className="card">
            <h3>{tag.name}</h3>
            <p className="muted">Использований: {tag.usageCount}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
