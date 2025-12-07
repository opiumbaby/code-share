import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as collectionService from '../services/collectionService';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
    prisma: {
        collection: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

describe('CollectionService', () => {
    // перед каждым тестом очищаем историю вызовов моков
    beforeEach(() => vi.clearAllMocks());

    const mockCollection = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Collection',
        ownerId: '507f1f77bcf86cd799439012',
        snippetIds: ['507f1f77bcf86cd799439013'],
        owner: { id: '507f1f77bcf86cd799439012', email: 'test@test.com', username: 'user', role: 'user' },
    };

    it('создает коллекцию', async () => {
        //  Мокаем поведение prisma.collection.create
        (prisma.collection.create as any).mockResolvedValue(mockCollection);

        const result = await collectionService.collectionService.createCollection({
            name: 'Test Collection',
            ownerId: '507f1f77bcf86cd799439012',
        });

        // проверка что мокнутый обьект вернулся
        expect(result).toEqual(mockCollection);
    });

    it('получает все коллекции', async () => {
        // Возвращаем массив из одной коллекции
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        const result = await collectionService.collectionService.getCollections();

        // Должен быть один элемент
        expect(result).toHaveLength(1);
    });

    it('фильтрует по ownerId', async () => {
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        await collectionService.collectionService.getCollections('507f1f77bcf86cd799439012');

        //  проверяем что findMany был вызван с нужным where и include
        expect(prisma.collection.findMany).toHaveBeenCalledWith({
            where: { ownerId: '507f1f77bcf86cd799439012' },
            include: { owner: true },
        });
    });

    it('фильтрует невалидные коллекции', async () => {
        // Вторая коллекция  невалидная (owner: null)
        const collections = [
            mockCollection,
            { ...mockCollection, id: '2', owner: null },
        ];

        (prisma.collection.findMany as any).mockResolvedValue(collections);

        const result = await collectionService.collectionService.getCollections();

        // Должна остаться только 1 валидная коллекция
        expect(result).toHaveLength(1);
    });
});
