import { describe, it, expect, beforeEach } from 'vitest';
import * as commentService from '../services/commentService';
import { prisma } from '../prisma';

describe('CommentService', () => {
    beforeEach(() => {
        // Очищаем вызовы моков перед каждым тестом
        vi.clearAllMocks();
    });

    // Тестовый комментарий который возвращают моки
    const mockComment = {
        id: '507f1f77bcf86cd799439011',
        text: 'Great code!',
        authorId: '507f1f77bcf86cd799439012',
        snippetId: '507f1f77bcf86cd799439013',
        createdAt: new Date(),
        author: { id: '507f1f77bcf86cd799439012', email: 'test@test.com', username: 'user', role: 'user' },
        snippet: { id: '507f1f77bcf86cd799439013', title: 'Test', code: 'code', tags: [], languageId: 'lang123' },
    };

    it('создаёт комментарий', async () => {
        // Настраиваем mock для prisma.create
        (prisma.comment.create as any).mockResolvedValue(mockComment);

        // Вызываем метод сервиса
        const result = await commentService.commentService.createComment({
            text: 'Great code!',
            authorId: '507f1f77bcf86cd799439012',
            snippetId: '507f1f77bcf86cd799439013',
        });

        // Проверяем корректность данных переданных в prisma
        expect(prisma.comment.create).toHaveBeenCalledWith({
            data: {
                text: 'Great code!',
                authorId: '507f1f77bcf86cd799439012',
                snippetId: '507f1f77bcf86cd799439013',
            },
        });

        expect(result).toEqual(mockComment);
    });

    it('получает все комментарии', async () => {
        // Возвращаем список комментариев
        (prisma.comment.findMany as any).mockResolvedValue([mockComment]);

        const result = await commentService.commentService.getComments();

        expect(prisma.comment.findMany).toHaveBeenCalled();
        expect(result).toHaveLength(1);
    });

    it('фильтрует по snippetId', async () => {
        (prisma.comment.findMany as any).mockResolvedValue([mockComment]);

        // Передаём snippetId - сервис должен отфильтровать
        await commentService.commentService.getComments('507f1f77bcf86cd799439013');

        expect(prisma.comment.findMany).toHaveBeenCalledWith({
            where: { snippetId: '507f1f77bcf86cd799439013' },
            include: { author: true, snippet: true },
        });
    });

    it('фильтрует невалидные комментарии', async () => {
        // Один нормальный и два невалидных
        const comments = [
            mockComment,
            { ...mockComment, id: '2', author: null },
            { ...mockComment, id: '3', snippet: null },
        ];

        (prisma.comment.findMany as any).mockResolvedValue(comments);

        const result = await commentService.commentService.getComments();

        // Остаётся только один валидный комментарий
        expect(result).toHaveLength(1);
    });

    it('фильтрует по authorId', async () => {

        const author1Comment = {
            ...mockComment,
            authorId: '507f1f77bcf86cd799439012',
            text: 'Comment',
        };

        (prisma.comment.findMany as any).mockResolvedValue([author1Comment]);
        const result = await commentService.commentService.getComments(
            undefined,
            '507f1f77bcf86cd799439012'
        );

        expect(prisma.comment.findMany).toHaveBeenCalledWith({
            where: { authorId: '507f1f77bcf86cd799439012' },
            include: { author: true, snippet: true },
        });

        expect(result).toHaveLength(1);
        expect(result[0].authorId).toBe('507f1f77bcf86cd799439012');
        expect(result[0].text).toBe('Comment');
    });

    it('фильтрует по languageId', async () => {

        const jsComm = {
            ...mockComment,
            id: '1',
            text: 'сomment',
            snippet: {
                id: 's1',
                title: 'JS Code',
                code: 'console.log()',
                tags: [],
                languageId: '507f1f77bcf86cd799439020',
            },
        };


        (prisma.comment.findMany as any).mockResolvedValue([jsComm]);


        const result = await commentService.commentService.getComments(
            undefined,
            undefined,
            '507f1f77bcf86cd799439020'
        );


        expect(prisma.comment.findMany).toHaveBeenCalledWith({
            where: {
                snippet: {
                    languageId: '507f1f77bcf86cd799439020'
                }
            },
            include: { author: true, snippet: true },
        });

        expect(result).toHaveLength(1);
        expect(result[0].snippet!.languageId).toBe('507f1f77bcf86cd799439020');
        expect(result[0].text).toBe('сomment');
    });


    it('обновляет комментарий', async () => {
        const updatedComment = { ...mockComment, text: 'Updated text!' };

        (prisma.comment.update as any).mockResolvedValue(updatedComment);

        const result = await commentService.commentService.updateComment(
            '507f1f77bcf86cd799439011',
            { text: 'Updated text' }
        );


        expect(prisma.comment.update).toHaveBeenCalledWith({
            where: { id: '507f1f77bcf86cd799439011' },
            data: { text: 'Updated text' },
        });

        expect(result).toEqual(updatedComment);
    });

    it('удаляет комментарий', async () => {

        (prisma.comment.delete as any).mockResolvedValue(mockComment);

        await commentService.commentService.deleteComment('507f1f77bcf86cd799439011');

        expect(prisma.comment.delete).toHaveBeenCalledWith({
            where: { id: '507f1f77bcf86cd799439011' },
        });
    });
});

