"use client";

import { trpc } from "@/lib/trpc";

export default function ActivityPage() {
  const activityQuery = trpc.activity.list.useQuery({ page: 1, pageSize: 20 });

  return (
    <section className="stack">
      <div className="card">
        <h2>Активность</h2>
      </div>

      {activityQuery.isError && <p>Требуется авторизация</p>}

      <div className="stack">
        {activityQuery.data?.map((item) => (
          <div key={item.id} className="card">
            <p>{item.action ?? item.type}</p>
            {item.targetType === "snippet" && item.targetId ? (
              <p>
                Сниппет:{" "}
                <a href={`/snippets/${item.targetId}`}>
                  {item.targetTitle ?? "Удалённый сниппет"}
                </a>
              </p>
            ) : null}
            {item.targetType === "collection" ? (
              <p>Коллекция: {item.targetTitle ?? "Удалённая коллекция"}</p>
            ) : null}
            {item.targetType === "comment" ? (
              <p>
                К сниппету:{" "}
                {item.targetId ? (
                  <a href={`/snippets/${item.targetId}`}>
                    {item.targetTitle ?? "Удалённый сниппет"}
                  </a>
                ) : (
                  "Удалённый сниппет"
                )}
              </p>
            ) : null}
            {item.commentText ? <p className="muted">«{item.commentText}»</p> : null}
            <p className="muted">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
