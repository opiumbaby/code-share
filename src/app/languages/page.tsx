"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function LanguagesPage() {
  const languagesQuery = trpc.language.list.useQuery();
  const createMutation = trpc.language.create.useMutation({
    onSuccess: () => languagesQuery.refetch(),
  });
  const updateMutation = trpc.language.update.useMutation({
    onSuccess: () => languagesQuery.refetch(),
  });
  const deleteMutation = trpc.language.delete.useMutation({
    onSuccess: () => languagesQuery.refetch(),
  });

  const [newName, setNewName] = useState("");
  const [newExtension, setNewExtension] = useState("");
  const [updateId, setUpdateId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [updateExtension, setUpdateExtension] = useState("");
  const [deleteId, setDeleteId] = useState("");

  return (
    <section className="stack">
      <div className="card">
        <h2>Языки</h2>
        <div className="stack">
          <input
            placeholder="Название"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <input
            placeholder="Расширение (.ts)"
            value={newExtension}
            onChange={(event) => setNewExtension(event.target.value)}
          />
          <button
            onClick={() =>
              createMutation.mutate({
                name: newName.trim(),
                fileExtension: newExtension.trim(),
              })
            }
            disabled={createMutation.isPending}
          >
            Создать
          </button>
          {createMutation.isError && <p>Ошибка создания или нужна авторизация</p>}
        </div>
      </div>

      <div className="card">
        <h3>Обновить язык</h3>
        <div className="stack">
          <input
            placeholder="ID языка"
            value={updateId}
            onChange={(event) => setUpdateId(event.target.value)}
          />
          <input
            placeholder="Новое имя"
            value={updateName}
            onChange={(event) => setUpdateName(event.target.value)}
          />
          <input
            placeholder="Новое расширение"
            value={updateExtension}
            onChange={(event) => setUpdateExtension(event.target.value)}
          />
          <button
            onClick={() =>
              updateMutation.mutate({
                id: updateId,
                name: updateName.trim() || undefined,
                fileExtension: updateExtension.trim() || undefined,
              })
            }
            disabled={updateMutation.isPending}
          >
            Обновить
          </button>
          {updateMutation.isError && <p>Ошибка обновления или нужна авторизация</p>}
        </div>
      </div>

      <div className="card">
        <h3>Удалить язык</h3>
        <div className="row">
          <input
            placeholder="ID языка"
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
        {deleteMutation.isError && <p>Язык используется или нужна авторизация</p>}
      </div>

      <div className="grid">
        {languagesQuery.data?.map((language) => (
          <div key={language.id} className="card">
            <h3>{language.name}</h3>
            <p className="muted">Расширение: {language.fileExtension}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
