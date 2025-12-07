import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as commentService from '../services/commentService';
import { prisma } from '../prisma';

// Мокаем prisma, чтобы реальные запросы к базе не выполнялись
vi.mock('../prisma', () => ({
    prisma: {
        comment: {
            create: vi.fn(),
            findMany: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('CommentService', () => {
    beforeEach(() => vi.clearAllMocks()); // Сбрасываем моки перед каждым тестом

    const mockComment = {
        id: '507f1f77bcf86cd799439011',
        text: 'Great code!',
        authorId: '507f1f77bcf86cd799439012',
        snippetId: '507f1f77bcf86cd799439013',
        createdAt: new Date(),
        author: { id: '507f1f77bcf86cd799439012', email: 'test@test.com', username: 'user', role: 'user' },
        snippet: { id: '507f1f77bcf86cd799439013', title: 'Test', code: 'code', tags: [] },
    };

    it('создает комментарий', async () => {
        // Мокируем результат prisma.create
        (prisma.comment.create as any).mockResolvedValue(mockComment);

        const result = await commentService.commentService.createComment({
            text: 'Great code!',
            authorId: '507f1f77bcf86cd799439012',
            snippetId: '507f1f77bcf86cd799439013',
        });

        expect(result).toEqual(mockComment); // Проверяем, что сервис вернул правильные данные
    });

    it('получает все комментарии', async () => {
        // Мокируем результат prisma.findMany
        (prisma.comment.findMany as any).mockResolvedValue([mockComment]);

        const result = await commentService.commentService.getComments();

        expect(result).toHaveLength(1); // Проверяем, что вернулся массив нужной длины
    });

    it('удаляет комментарий', async () => {
        // Мокируем prisma.delete
        (prisma.comment.delete as any).mockResolvedValue(mockComment);

        await commentService.commentService.deleteComment('507f1f77bcf86cd799439011');

        expect(prisma.comment.delete).toHaveBeenCalledWith({
            where: { id: '507f1f77bcf86cd799439011' }, // Проверяем корректность запроса
        });
    });
});
