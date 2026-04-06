"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function FavoritesPage() {
  const favoritesQuery = trpc.favorite.listDetailed.useQuery();

  return (
    <section className="stack">
      <div className="card">
        <h2>Избранное</h2>
        <button className="secondary" onClick={() => favoritesQuery.refetch()}>
          Обновить
        </button>
      </div>

      {favoritesQuery.isError && <p>Требуется авторизация</p>}

      <div className="stack">
        {favoritesQuery.data?.map((favorite) => {
          const title = favorite.snippetTitle ?? "Сниппет удалён";
          return (
            <div key={favorite.id} className="card">
              <p>Snippet: {title}</p>
              {favorite.snippetTitle ? (
                <Link href={`/snippets/${favorite.snippetId}`}>Открыть</Link>
              ) : null}
              <p>Added: {new Date(favorite.createdAt).toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
