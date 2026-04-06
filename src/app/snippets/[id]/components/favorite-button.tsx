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
      <button className="secondary" onClick={handleToggle} disabled={addMutation.isPending || removeMutation.isPending}>
        {isFavorited ? "Убрать из избранного" : "В избранное"}
      </button>
      {(addMutation.isError || removeMutation.isError) && <p>Нужна авторизация</p>}
    </div>
  );
}
