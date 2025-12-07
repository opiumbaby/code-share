import { prisma } from "../prisma";

//
// ─── ИНТЕРФЕЙСЫ ───────────────────────────────────────────────
//

// Данные для создания сниппета
export interface CreateSnippetData {
  title: string;
  code: string;
  languageId?: string;
  authorId?: string;
  tags?: string[];
}

// Фильтры при получении списка
export interface SnippetFilter {
  tag?: string;
  languageId?: string;
}

// Данные для обновления сниппета
export interface UpdateSnippetData {
  title?: string;
  code?: string;
  languageId?: string;
  tags?: string[];
}

//
// ─── СЕРВИСЫ ─────────────────────────────────────────────────
//

// Создать сниппет
export const createSnippetService = async (data: CreateSnippetData) => {
  return prisma.snippet.create({
    data: {
      title: data.title,
      code: data.code,
      languageId: data.languageId,
      authorId: data.authorId,
      tags: data.tags || [],
    },
    include: {
      author: true,
      language: true,
      comments: true,
    },
  });
};

// Получить все сниппеты (с фильтрацией)
export const getSnippetsService = async (filter?: SnippetFilter) => {
  const where: any = {};

  if (filter?.tag) {
    where.tags = { has: filter.tag };
  }
  if (filter?.languageId) {
    where.languageId = filter.languageId;
  }

  const snippets = await prisma.snippet.findMany({
    where,
    include: {
      author: true,
      language: true,
      comments: true,
    },
  });

  // Убрать "осиротевшие" записи без автора или языка
  return snippets.filter(s => s.author !== null && s.language !== null);
};

// Получить сниппет по ID
export const getSnippetByIdService = async (id: string) => {
  return prisma.snippet.findUnique({
    where: { id },
    include: {
      author: true,
      language: true,
      comments: true,
    },
  });
};

// Обновить сниппет
export const updateSnippetService = async (id: string, data: UpdateSnippetData) => {
  return prisma.snippet.update({
    where: { id },
    data: {
      title: data.title,
      code: data.code,
      languageId: data.languageId,
      tags: data.tags,
    },
    include: {
      author: true,
      language: true,
      comments: true,
    },
  });
};

// Удалить сниппет
export const deleteSnippetService = async (id: string) => {
  return prisma.snippet.delete({
    where: { id },
  });
};
