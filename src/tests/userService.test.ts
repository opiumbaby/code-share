import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as userService from '../services/userService';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('UserService', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    createdAt: new Date(),
    snippets: [],
  };

  it('создает пользователя', async () => {
    (prisma.user.create as any).mockResolvedValue(mockUser);
    
    const result = await userService.createUserService({
      email: 'test@example.com',
      username: 'testuser',
      role: 'USER',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      },
    });
    expect(result).toEqual(mockUser);
  });

  it('получает всех пользователей', async () => {
    const mockUsers = [
      mockUser,
      { ...mockUser, id: '2', email: 'user2@example.com', username: 'user2' },
    ];
    (prisma.user.findMany as any).mockResolvedValue(mockUsers);
    
    const result = await userService.getUsersService();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      include: { snippets: true },
    });
    expect(result).toHaveLength(2);
  });

  it('получает пользователя по ID', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    
    const result = await userService.getUserByIdService('1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { snippets: true },
    });
    expect(result).toEqual(mockUser);
  });

  it('возвращает null если пользователь не найден', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    
    const result = await userService.getUserByIdService('nonexistent');

    expect(result).toBeNull();
  });

  it('обновляет пользователя', async () => {
    const updatedUser = { ...mockUser, username: 'newusername' };
    (prisma.user.update as any).mockResolvedValue(updatedUser);
    
    const result = await userService.updateUserService('1', { username: 'newusername' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { username: 'newusername' },
    });
    expect(result).toEqual(updatedUser);
  });

  it('обновляет несколько полей пользователя', async () => {
    const updatedUser = { ...mockUser, email: 'new@example.com', role: 'ADMIN' };
    (prisma.user.update as any).mockResolvedValue(updatedUser);
    
    await userService.updateUserService('1', {
      email: 'new@example.com',
      role: 'ADMIN',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        email: 'new@example.com',
        role: 'ADMIN',
      },
    });
  });

  it('удаляет пользователя', async () => {
    (prisma.user.delete as any).mockResolvedValue(mockUser);
    
    await userService.deleteUserService('1');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});