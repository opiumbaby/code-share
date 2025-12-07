import { describe, it, expect, beforeEach } from 'vitest';
import * as collectionService from '../services/collectionService';
import { prisma } from '../prisma';

describe('CollectionService', () => {
    beforeEach(() => {
        // Перед каждым тестом очищаем вызовы моков
        vi.clearAllMocks();
    });

    // Фейковая коллекция которую будут возвращать моки
    const mockCollection = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Collection',
        ownerId: '507f1f77bcf86cd799439012',
        snippetIds: ['507f1f77bcf86cd799439013'],
        owner: { id: '507f1f77bcf86cd799439012', email: 'test@test.com', username: 'user', role: 'user' },
    };

    it('создаёт коллекцию', async () => {
        // Мокаем create и подменяем возвращаемое значение
        (prisma.collection.create as any).mockResolvedValue(mockCollection);

        // Вызываем сервис
        const result = await collectionService.collectionService.createCollection({
            name: 'Test Collection',
            ownerId: '507f1f77bcf86cd799439012',
        });

        // Проверяем, что prisma.create был вызван с нужными данными
        expect(prisma.collection.create).toHaveBeenCalledWith({
            data: {
                name: 'Test Collection',
                ownerId: '507f1f77bcf86cd799439012',
                snippetIds: [],
            },
        });

        // Проверяем результат
        expect(result).toEqual(mockCollection);
    });

    it('получает все коллекции', async () => {
        // Возвращаем массив с одной коллекцией
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        const result = await collectionService.collectionService.getCollections();

        // Проверяем вызов и результат
        expect(prisma.collection.findMany).toHaveBeenCalled();
        expect(result).toHaveLength(1);
    });

    it('фильтрует по ownerId', async () => {
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        // Передаём ownerId - сервис должен вызвать findMany с фильтром
        await collectionService.collectionService.getCollections('507f1f77bcf86cd799439012');

        expect(prisma.collection.findMany).toHaveBeenCalledWith({
            where: { ownerId: '507f1f77bcf86cd799439012' },
            include: { owner: true },
        });
    });

    it('фильтрует невалидные коллекции', async () => {
        // Возвращаем одну нормальную и одну без owner
        const collections = [
            mockCollection,
            { ...mockCollection, id: '2', owner: null },
        ];
        (prisma.collection.findMany as any).mockResolvedValue(collections);

        const result = await collectionService.collectionService.getCollections();

        // Должна остаться только валидная
        expect(result).toHaveLength(1);
    });
});
