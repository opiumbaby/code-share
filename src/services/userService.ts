import { prisma } from "../prisma";

// Интерфейс для данных при создании пользователя
export interface CreateUserData {
  email: string;
  username: string;
  role: string;
}

// Интерфейс для данных при обновлении пользователя
export interface UpdateUserData {
  email?: string;
  username?: string;
  role?: string;
}

// Создать пользователя в базе
export const createUserService = async (data: CreateUserData) => {
  return prisma.user.create({
    data, 
  });
};

// Получить всех пользователей
export const getUsersService = async () => {
  return prisma.user.findMany({
    include: { snippets: true }, // взять также связанные сниппеты
  });
};

// Получить одного пользователя по ID
export const getUserByIdService = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },  
    include: { snippets: true },
  });
};

// Обновить пользователя
export const updateUserService = async (id: string, data: UpdateUserData) => {
  return prisma.user.update({
    where: { id },
    data, // какие поля обновляем
  });
};

// Удалить пользователя
export const deleteUserService = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  });
};
