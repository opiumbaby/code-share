"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

const nameByExtension: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  cpp: "C++",
};

function normalizeExtension(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

export default function EditSnippetPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const snippetQuery = trpc.snippet.byId.useQuery({ id }, { enabled: !!id });
  const tagsQuery = trpc.snippet.tags.useQuery({ id }, { enabled: !!id });
  const languagesQuery = trpc.language.list.useQuery();
  const createLanguage = trpc.language.create.useMutation();
  const updateMutation = trpc.snippet.update.useMutation();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [languageExtension, setLanguageExtension] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (snippetQuery.data) {
      setTitle(snippetQuery.data.title);
      setCode(snippetQuery.data.code);
      const language = languagesQuery.data?.find(
        (item) => item.id === snippetQuery.data.languageId
      );
      if (language?.fileExtension) {
        setLanguageExtension(language.fileExtension);
      }
    }
  }, [snippetQuery.data, languagesQuery.data]);

  useEffect(() => {
    if (tagsQuery.data) {
      setTags(tagsQuery.data.join(", "));
    }
  }, [tagsQuery.data]);

  const handleSubmit = async () => {
    setFormError("");
    if (!title.trim() || !code.trim()) {
      setFormError("Заполните заголовок и код.");
      return;
    }

    const extension = normalizeExtension(languageExtension);
    if (!extension) {
      setFormError("Укажите расширение файла.");
      return;
    }

    let resolvedLanguageId: string | undefined;
    const existing = languagesQuery.data?.find(
      (language) => language.fileExtension.toLowerCase() === extension
    );

    if (existing) {
      resolvedLanguageId = existing.id;
    } else {
      const key = extension.replace(".", "");
      const name = nameByExtension[key] ?? key.toUpperCase();
      const created = await createLanguage.mutateAsync({
        name,
        fileExtension: extension,
      });
      resolvedLanguageId = created.id;
    }

    await updateMutation.mutateAsync({
      id,
      title: title.trim(),
      code: code.trim(),
      languageId: resolvedLanguageId,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  if (!id) {
    return <p>Некорректный идентификатор</p>;
  }

  return (
    <section className="stack">
      <div className="card">
        <h2>Редактировать сниппет</h2>
        <div className="stack">
          <input
            placeholder="Заголовок"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            rows={8}
            placeholder="Код"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <input
            placeholder="Расширение (.ts, .js, .cpp)"
            value={languageExtension}
            onChange={(event) => setLanguageExtension(event.target.value)}
          />
          <input
            placeholder="Теги через запятую"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <button onClick={handleSubmit} disabled={updateMutation.isPending}>
            Сохранить
          </button>
          {formError && <p>{formError}</p>}
          {updateMutation.isError && <p>Ошибка сохранения или нет доступа</p>}
          {updateMutation.isSuccess && <p>Изменения сохранены</p>}
        </div>
      </div>
    </section>
  );
}
