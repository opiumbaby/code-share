"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function CollectionsPage() {
  const meQuery = trpc.user.me.useQuery();
  const userId = meQuery.data?.id ?? "";
  const collectionsQuery = trpc.collection.list.useQuery(
    userId ? { ownerId: userId } : undefined,
    { enabled: !!userId }
  );
  const snippetsQuery = trpc.snippet.mine.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: !!userId }
  );
  const createMutation = trpc.collection.create.useMutation({
    onSuccess: () => collectionsQuery.refetch(),
  });
  const updateMutation = trpc.collection.update.useMutation({
    onSuccess: () => collectionsQuery.refetch(),
  });
  const deleteMutation = trpc.collection.delete.useMutation({
    onSuccess: () => collectionsQuery.refetch(),
  });

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const router = useRouter();

  const editingSnippetsQuery = trpc.collection.snippets.useQuery(
    { id: editingId ?? "" },
    { enabled: !!editingId }
  );

  useEffect(() => {
    if (editingSnippetsQuery.data) {
      setEditingIds(editingSnippetsQuery.data.map((item) => item.id));
    }
  }, [editingSnippetsQuery.data]);

  const filteredSnippets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = snippetsQuery.data ?? [];
    if (!query) return items;
    return items.filter((snippet) => snippet.title.toLowerCase().includes(query));
  }, [search, snippetsQuery.data]);

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      name: name.trim(),
      snippetIds: selectedIds,
    });
    setName("");
    setSelectedIds([]);
  };

  return (
    <section className="stack">
      <div className="card">
        <h2>Папки</h2>
        <p className="muted">
          Папка — это подборка сниппетов. Можно создать пустую и добавить сниппеты позже.
        </p>
        {meQuery.isError && <p>Требуется авторизация</p>}
        {!meQuery.isError && !meQuery.data && <p>Войдите, чтобы управлять папками.</p>}
      </div>

      <div className="card">
        <h3>Создать папку</h3>
        <div className="stack">
          <input
            placeholder="Название"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            placeholder="Поиск по моим сниппетам"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="choice-grid">
            {filteredSnippets.length === 0 ? (
              <div className="stack">
                <p className="muted">
                  Нет сниппетов для выбора. Создайте сниппет и он появится здесь.
                </p>
                {snippetsQuery.isError ? (
                  <p className="muted">
                    Ошибка загрузки: {snippetsQuery.error?.message ?? "неизвестно"}
                  </p>
                ) : null}
                {snippetsQuery.isLoading ? <p className="muted">Загрузка...</p> : null}
                {snippetsQuery.data ? (
                  <p className="muted">
                    Всего найдено: {snippetsQuery.data.length}
                  </p>
                ) : null}
              </div>
            ) : (
              filteredSnippets.map((snippet) => {
                const checked = selectedIds.includes(snippet.id);
                return (
                  <button
                    key={snippet.id}
                    type="button"
                    className={`choice-chip ${checked ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== snippet.id)
                          : [...prev, snippet.id]
                      );
                    }}
                  >
                    {snippet.title}
                  </button>
                );
              })
            )}
          </div>
          <div className="row">
            <button onClick={handleCreate} disabled={createMutation.isPending || !name.trim()}>
              Создать папку
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                setName("");
                setSelectedIds([]);
              }}
            >
              Сбросить
            </button>
          </div>
          {createMutation.isError && <p>Ошибка создания или нужна авторизация</p>}
        </div>
      </div>

      <div className="grid">
        {collectionsQuery.isError ? (
          <div className="card">
            <p className="muted">Ошибка загрузки папок.</p>
          </div>
        ) : null}
        {collectionsQuery.data?.length === 0 ? (
          <div className="card">
            <p className="muted">Папок пока нет.</p>
          </div>
        ) : null}
        {collectionsQuery.data?.map((collection) => {
          const isOwner = userId && collection.ownerId === userId;
          return (
          <div
            key={collection.id}
            className="card folder-card"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/collections/${collection.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                router.push(`/collections/${collection.id}`);
              }
            }}
          >
            <div className="row">
              <h3>{collection.name}</h3>
              <span className="muted">Сниппетов: {collection.snippetsCount}</span>
            </div>
            <p className="muted">
              Создано: {new Date(collection.createdAt).toLocaleDateString()}
            </p>
            <div className="row">
              {isOwner ? (
                <>
                  <button
                    className="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(collection.id);
                      setEditingName(collection.name);
                    }}
                  >
                    Редактировать
                  </button>
                  <button
                    className="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteMutation.mutate({ id: collection.id });
                    }}
                  >
                    Удалить
                  </button>
                </>
              ) : null}
            </div>
            {editingId === collection.id && isOwner ? (
              <div className="stack" onClick={(event) => event.stopPropagation()}>
                <input
                  placeholder="Новое имя"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <div className="choice-grid">
                  {filteredSnippets.length === 0 ? (
                    <p className="muted">Нет сниппетов для выбора.</p>
                  ) : (
                    filteredSnippets.map((snippet) => {
                      const checked = editingIds.includes(snippet.id);
                      return (
                        <button
                          key={snippet.id}
                          type="button"
                          className={`choice-chip ${checked ? "selected" : ""}`}
                          onClick={() => {
                            setEditingIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== snippet.id)
                                : [...prev, snippet.id]
                            );
                          }}
                        >
                          {snippet.title}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="row">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: collection.id,
                        name: editingName.trim() || undefined,
                        snippetIds: editingIds,
                      })
                    }
                  >
                    Сохранить
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setEditingName("");
                      setEditingIds([]);
                    }}
                  >
                    Отмена
                  </button>
                </div>
                {updateMutation.isError && <p>Ошибка обновления или нет доступа</p>}
              </div>
            ) : null}
          </div>
        )})}
      </div>
    </section>
  );
}
