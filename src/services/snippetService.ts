import { prisma } from "../prisma";

// Создать сниппет
export const createSnippetService = async (data: {
  title: string;
  code: string;
  languageId?: string;
  authorId?: string;
  tags?: string[];
}) => {
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

// Получить все сниппеты (с опциональной фильтрацией)
export const getSnippetsService = async (filter?: {
  tag?: string;
  languageId?: string;
}) => {
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

  // Убираем "сиротевшие" записи
  return snippets.filter(s => s.author !== null && s.language !== null);
};

// Получить сниппет по ID
export const getSnippetByIdService = async (id: string) => {
  const snippet = await prisma.snippet.findUnique({
    where: { id },
    include: {
      author: true,
      language: true,
      comments: true,
    },
  });
  return snippet;
};

// Обновить сниппет
export const updateSnippetService = async (
  id: string,
  data: Partial<{
    title: string;
    code: string;
    languageId: string;
    tags: string[];
  }>
) => {
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