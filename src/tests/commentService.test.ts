import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as commentService from '../services/commentService';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
    prisma: {
        comment: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

describe('CommentService', () => {
    beforeEach(() => vi.clearAllMocks());

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
        (prisma.comment.create as any).mockResolvedValue(mockComment);

        const result = await commentService.commentService.createComment({
            text: 'Great code!',
            authorId: '507f1f77bcf86cd799439012',
            snippetId: '507f1f77bcf86cd799439013',
        });

        expect(result).toEqual(mockComment);
    });

    it('получает все комментарии', async () => {
        (prisma.comment.findMany as any).mockResolvedValue([mockComment]);

        const result = await commentService.commentService.getComments();

        expect(result).toHaveLength(1);
    });

    it('фильтрует по snippetId', async () => {
        (prisma.comment.findMany as any).mockResolvedValue([mockComment]);

        await commentService.commentService.getComments('507f1f77bcf86cd799439013');

        expect(prisma.comment.findMany).toHaveBeenCalledWith({
            where: { snippetId: '507f1f77bcf86cd799439013' },
            include: { author: true, snippet: true },
        });
    });

    it('фильтрует невалидные комментарии', async () => {
        const comments = [
            mockComment,
            { ...mockComment, id: '2', author: null },
            { ...mockComment, id: '3', snippet: null },
        ];
        (prisma.comment.findMany as any).mockResolvedValue(comments);

        const result = await commentService.commentService.getComments();

        expect(result).toHaveLength(1);
    });
});