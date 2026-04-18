"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { normalizeExtension } from "@/lib/snippet-utils";

export default function EditSnippetPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const snippetQuery = trpc.snippet.byId.useQuery({ id }, { enabled: !!id });
  const tagsQuery = trpc.snippet.tags.useQuery({ id }, { enabled: !!id });
  const languagesQuery = trpc.language.list.useQuery();
  const updateMutation = trpc.snippet.update.useMutation();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [languageExtension, setLanguageExtension] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState("");
  const [initializedSnippetId, setInitializedSnippetId] = useState<string | null>(null);
  const [tagsInitializedForSnippetId, setTagsInitializedForSnippetId] = useState<string | null>(null);

  useEffect(() => {
    if (snippetQuery.data && snippetQuery.data.id !== initializedSnippetId) {
      setTitle(snippetQuery.data.title);
      setCode(snippetQuery.data.code);
      setLanguageExtension("");
      setTags("");
      setTagsInitializedForSnippetId(null);
      setInitializedSnippetId(snippetQuery.data.id);
    }
  }, [snippetQuery.data, initializedSnippetId]);

  useEffect(() => {
    if (!snippetQuery.data || languageExtension) {
      return;
    }

    const language = languagesQuery.data?.find((item) => item.id === snippetQuery.data.languageId);
    if (language?.fileExtension) {
      setLanguageExtension(language.fileExtension);
    }
  }, [snippetQuery.data, languagesQuery.data, languageExtension]);

  useEffect(() => {
    if (
      snippetQuery.data &&
      tagsQuery.data &&
      tagsInitializedForSnippetId !== snippetQuery.data.id
    ) {
      setTags(tagsQuery.data.join(", "));
      setTagsInitializedForSnippetId(snippetQuery.data.id);
    }
  }, [snippetQuery.data, tagsQuery.data, tagsInitializedForSnippetId]);

  useEffect(() => {
    if (!snippetQuery.data) {
      setInitializedSnippetId(null);
      setTagsInitializedForSnippetId(null);
    }
  }, [snippetQuery.data]);

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

    const existing = languagesQuery.data?.find(
      (language) => language.fileExtension.toLowerCase() === extension
    );

    if (!existing) {
      setFormError("Недопустимое расширение. Выберите из списка.");
      return;
    }

    await updateMutation.mutateAsync({
      id,
      title: title.trim(),
      code: code.trim(),
      languageId: existing.id,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });

    router.push("/");
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
