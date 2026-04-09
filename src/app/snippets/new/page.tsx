"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

function normalizeExtension(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

export default function NewSnippetPage() {
  const createMutation = trpc.snippet.create.useMutation();
  const languagesQuery = trpc.language.list.useQuery();
  const meQuery = trpc.user.me.useQuery();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [languageExtension, setLanguageExtension] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    setFormError("");
    if (!title.trim() || !code.trim()) {
      setFormError("Заполните заголовок и код.");
      return;
    }
    if (meQuery.isError || !meQuery.data) {
      setFormError("Нужна авторизация.");
      return;
    }

    const extension = normalizeExtension(languageExtension);
    if (!extension) {
      setFormError("Укажите расширение файла, например .ts или .js.");
      return;
    }

    const existing = languagesQuery.data?.find(
      (language) => language.fileExtension.toLowerCase() === extension
    );

    if (!existing) {
      setFormError("Недопустимое расширение. Выберите из списка.");
      return;
    }

    const created = await createMutation.mutateAsync({
      title: title.trim(),
      code: code.trim(),
      languageId: existing.id,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });

    router.push(`/snippets/${created.id}`);
  };

  const acceptExtensions =
    languagesQuery.data?.map((language) => language.fileExtension).join(",") ?? "";

  return (
    <section className="stack">
      <div className="card">
        <h2>Новый сниппет</h2>
        <div className="stack">
          <input
            placeholder="Заголовок"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            placeholder="Код"
            rows={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <input
            type="file"
            accept={acceptExtensions}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              setCode(text);
              const extension = file.name.includes(".")
                ? `.${file.name.split(".").pop()}`.toLowerCase()
                : "";
              if (extension) {
                setLanguageExtension(extension);
                const allowed = languagesQuery.data?.some(
                  (language) => language.fileExtension.toLowerCase() === extension
                );
                if (languagesQuery.data && !allowed) {
                  setFormError("Недопустимое расширение. Выберите из списка.");
                }
              }
              if (!title.trim()) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
              }
            }}
          />
          <input
            list="language-extensions"
            placeholder="Или введите расширение (.ts, .js, .cpp)"
            value={languageExtension}
            onChange={(event) => setLanguageExtension(event.target.value)}
          />
          <datalist id="language-extensions">
            {languagesQuery.data?.map((language) => (
              <option key={language.id} value={language.fileExtension} />
            ))}
          </datalist>
          <input
            placeholder="Теги через запятую"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <button onClick={handleSubmit} disabled={createMutation.isPending}>
            Создать
          </button>
          {formError && <p>{formError}</p>}
          {meQuery.isError && <p>Нужна авторизация</p>}
          {createMutation.isError && <p>Ошибка при создании или требуется авторизация</p>}
          {createMutation.isSuccess && <p>Сниппет создан</p>}
        </div>
      </div>
    </section>
  );
}
