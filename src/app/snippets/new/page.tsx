"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

const nameByExtension: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  tsx: "TypeScript",
  py: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  cs: "C#",
  go: "Go",
  rs: "Rust",
  kt: "Kotlin",
  swift: "Swift",
  php: "PHP",
  rb: "Ruby",
  sql: "SQL",
  sh: "Bash",
  html: "HTML",
  css: "CSS",
  dart: "Dart",
  scala: "Scala",
  r: "R",
};

function normalizeExtension(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

export default function NewSnippetPage() {
  const createMutation = trpc.snippet.create.useMutation();
  const languagesQuery = trpc.language.list.useQuery();
  const createLanguage = trpc.language.create.useMutation();
  const meQuery = trpc.user.me.useQuery();

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

    await createMutation.mutateAsync({
      title: title.trim(),
      code: code.trim(),
      languageId: resolvedLanguageId,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });

    setTitle("");
    setCode("");
    setLanguageExtension("");
    setTags("");
  };

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
            accept=".ts,.tsx,.js,.jsx,.py,.java,.c,.cpp,.cs,.go,.rs,.kt,.swift,.php,.rb,.sql,.sh,.html,.css,.dart,.scala,.r,.txt"
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
