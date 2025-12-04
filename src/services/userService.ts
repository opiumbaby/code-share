import { prisma } from "../prisma";

// Создать пользователя
export const createUserService = async (data: {
  email: string;
  username: string;
  role: string;
}) => {
  return prisma.user.create({ data });
};

// Получить всех пользователей
export const getUsersService = async () => {
  return prisma.user.findMany({
    include: { snippets: true }, // подтянуть связанные сниппеты
  });
};

// Получить пользователя по ID
export const getUserByIdService = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: { snippets: true },
  });
};

// Обновить пользователя
export const updateUserService = async (
  id: string,
  data: Partial<{ email: string; username: string; role: string }>
) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

// Удалить пользователя
export const deleteUserService = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  });
};
