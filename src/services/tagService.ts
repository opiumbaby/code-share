import { prisma } from "../prisma";

// Создать тег
export const createTagService = async (data: { name: string }) => {
  return prisma.tag.create({ data });
};

// Получить все теги
export const getTagsService = async () => {
  return prisma.tag.findMany();
};

// Получить тег по ID
export const getTagByIdService = async (id: string) => {
  return prisma.tag.findUnique({ where: { id } });
};

// Обновить тег
export const updateTagService = async (id: string, data: Partial<{ name: string }>) => {
  return prisma.tag.update({ where: { id }, data });
};

// Удалить тег
export const deleteTagService = async (id: string) => {
  return prisma.tag.delete({ where: { id } });
};