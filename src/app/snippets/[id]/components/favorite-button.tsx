"use client";

import { trpc } from "@/lib/trpc";

export default function FavoriteButton({ snippetId }: { snippetId: string }) {
  const favoritesQuery = trpc.favorite.list.useQuery();
  const addMutation = trpc.favorite.add.useMutation({
    onSuccess: () => favoritesQuery.refetch(),
  });
  const removeMutation = trpc.favorite.remove.useMutation({
    onSuccess: () => favoritesQuery.refetch(),
  });

  const isFavorited = favoritesQuery.data?.some((item) => item.snippetId === snippetId) ?? false;

  const handleToggle = async () => {
    if (isFavorited) {
      await removeMutation.mutateAsync({ snippetId });
    } else {
      await addMutation.mutateAsync({ snippetId });
    }
  };

  return (
    <div className="row">
      <button
        className={isFavorited ? "favorite-toggle active" : "favorite-toggle"}
        onClick={handleToggle}
        disabled={addMutation.isPending || removeMutation.isPending}
        aria-pressed={isFavorited}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21.2c-.3 0-.6-.1-.8-.3l-7.2-6.7A5.3 5.3 0 0 1 3.2 7a5.2 5.2 0 0 1 9-2.6A5.2 5.2 0 0 1 21.8 7a5.3 5.3 0 0 1-1.8 7.2l-7.2 6.7c-.2.2-.5.3-.8.3z"
            fill="currentColor"
          />
        </svg>
        {isFavorited ? "В избранном" : "Добавить в избранное"}
      </button>
      {(addMutation.isError || removeMutation.isError) && <p>Нужна авторизация</p>}
    </div>
  );
}
