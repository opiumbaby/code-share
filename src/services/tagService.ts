import { prisma } from "../prisma";
// Данные при создании тега
export interface CreateTagData {
  name: string;
}

// Данные при обновлении тега
export interface UpdateTagData {
  name?: string;
}

// Создать тег
export const createTagService = async (data: CreateTagData) => {
  return prisma.tag.create({
    data, // передаём объект целиком
  });
};

// Получить все теги
export const getTagsService = async () => {
  return prisma.tag.findMany(); 
};

// Получить тег по ID
export const getTagByIdService = async (id: string) => {
  return prisma.tag.findUnique({
    where: { id },
  });
};

// Обновить тег
export const updateTagService = async (id: string, data: UpdateTagData) => {
  return prisma.tag.update({
    where: { id },
    data,          // какие поля меняем
  });
};

// Удалить тег
export const deleteTagService = async (id: string) => {
  return prisma.tag.delete({
    where: { id },
  });
};
