"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function CollectionDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const collectionQuery = trpc.collection.byId.useQuery({ id }, { enabled: !!id });
  const snippetsQuery = trpc.collection.snippets.useQuery({ id }, { enabled: !!id });
  const meQuery = trpc.user.me.useQuery();
  const mineQuery = trpc.snippet.mine.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: !!meQuery.data }
  );
  const updateMutation = trpc.collection.update.useMutation({
    onSuccess: () => {
      snippetsQuery.refetch();
      setSelected([]);
    },
  });

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const currentIds = useMemo(
    () => new Set((snippetsQuery.data ?? []).map((item) => item.id)),
    [snippetsQuery.data]
  );
  const currentOwnedIds = useMemo(() => {
    const meId = meQuery.data?.id;
    return new Set(
      (snippetsQuery.data ?? [])
        .filter((item) => (meId ? item.authorId === meId : false))
        .map((item) => item.id)
    );
  }, [snippetsQuery.data, meQuery.data?.id]);

  const combinedSnippets = useMemo(() => {
    const map = new Map<
      string,
      { id: string; title: string; inFolder: boolean; owned: boolean }
    >();

    for (const snippet of mineQuery.data ?? []) {
      map.set(snippet.id, {
        id: snippet.id,
        title: snippet.title,
        inFolder: currentIds.has(snippet.id),
        owned: true,
      });
    }

    for (const snippet of snippetsQuery.data ?? []) {
      const existing = map.get(snippet.id);
      if (existing) {
        existing.inFolder = true;
      } else {
        map.set(snippet.id, {
          id: snippet.id,
          title: snippet.title,
          inFolder: true,
          owned: meQuery.data?.id ? snippet.authorId === meQuery.data.id : false,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [mineQuery.data, snippetsQuery.data, currentIds]);

  const filteredSnippets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = combinedSnippets;
    if (!query) return items;
    return items.filter((snippet) => snippet.title.toLowerCase().includes(query));
  }, [search, combinedSnippets]);

  if (!id) {
    return <p>Некорректный идентификатор</p>;
  }

  if (collectionQuery.isLoading) {
    return <p>Загрузка...</p>;
  }

  if (!collectionQuery.data) {
    return <p>Папка не найдена</p>;
  }

  return (
    <section className="stack">
      <div className="card">
        <h2>{collectionQuery.data.name}</h2>
        <p className="muted">
          Создано: {new Date(collectionQuery.data.createdAt).toLocaleDateString()}
        </p>
      </div>

      {meQuery.data?.id === collectionQuery.data.ownerId ? (
        <div className="card">
          <h3>Добавить сниппеты</h3>
          <div className="stack">
            <input
              placeholder="Поиск по моим сниппетам"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="choice-grid">
              {filteredSnippets.length === 0 ? (
                <div className="stack">
                  <p className="muted">Нет сниппетов для выбора.</p>
                  {mineQuery.isError ? (
                    <p className="muted">
                      Ошибка загрузки: {mineQuery.error?.message ?? "неизвестно"}
                    </p>
                  ) : null}
                  {mineQuery.isLoading ? <p className="muted">Загрузка...</p> : null}
                  {mineQuery.data ? (
                    <p className="muted">Всего найдено: {mineQuery.data.length}</p>
                  ) : null}
                </div>
              ) : (
                filteredSnippets.map((snippet) => {
                  const already = snippet.inFolder;
                  const checked = selected.includes(snippet.id);
                  const canToggle = snippet.owned || !snippet.inFolder;
                  const chipClass = already
                    ? checked
                      ? "choice-chip remove"
                      : "choice-chip in-folder"
                    : checked
                    ? "choice-chip selected"
                    : "choice-chip";
                  return (
                    <button
                      key={snippet.id}
                      type="button"
                      className={chipClass}
                      onClick={() => {
                        if (!canToggle) {
                          return;
                        }
                        setSelected((prev) =>
                          checked ? prev.filter((id) => id !== snippet.id) : [...prev, snippet.id]
                        );
                      }}
                    >
                      {snippet.title}
                      {!snippet.owned && snippet.inFolder
                        ? " (чужой)"
                        : already
                        ? " (в папке)"
                        : ""}
                    </button>
                  );
                })
              )}
            </div>
            <div className="row">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id,
                    snippetIds: Array.from(
                      selected.reduce((set, snippetId) => {
                        if (set.has(snippetId)) {
                          set.delete(snippetId);
                        } else {
                          set.add(snippetId);
                        }
                        return set;
                      }, new Set(currentOwnedIds))
                    ),
                  })
                }
                disabled={selected.length === 0}
              >
                Обновить
              </button>
              <button
                className="secondary"
                onClick={() => setSelected([])}
                type="button"
              >
                Сбросить
              </button>
            </div>
            {updateMutation.isError && (
              <p>{updateMutation.error?.message ?? "Ошибка обновления"}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>Сниппеты</h3>
        {(snippetsQuery.data ?? []).length === 0 ? (
          <p className="muted">Пока нет сниппетов.</p>
        ) : (
          <div className="grid">
            {snippetsQuery.data?.map((snippet) => (
              <Link key={snippet.id} href={`/snippets/${snippet.id}`} className="card snippet-tile">
                <h4>{snippet.title}</h4>
                <span className="muted">Открыть сниппет</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
