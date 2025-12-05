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
    beforeEach(() => vi.clearAllMocks());

    const mockCollection = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Collection',
        ownerId: '507f1f77bcf86cd799439012',
        snippetIds: ['507f1f77bcf86cd799439013'],
        owner: { id: '507f1f77bcf86cd799439012', email: 'test@test.com', username: 'user', role: 'user' },
    };

    it('создает коллекцию', async () => {
        (prisma.collection.create as any).mockResolvedValue(mockCollection);

        const result = await collectionService.collectionService.createCollection({
            name: 'Test Collection',
            ownerId: '507f1f77bcf86cd799439012',
        });

        expect(result).toEqual(mockCollection);
    });

    it('получает все коллекции', async () => {
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        const result = await collectionService.collectionService.getCollections();

        expect(result).toHaveLength(1);
    });

    it('фильтрует по ownerId', async () => {
        (prisma.collection.findMany as any).mockResolvedValue([mockCollection]);

        await collectionService.collectionService.getCollections('507f1f77bcf86cd799439012');

        expect(prisma.collection.findMany).toHaveBeenCalledWith({
            where: { ownerId: '507f1f77bcf86cd799439012' },
            include: { owner: true },
        });
    });

    it('фильтрует невалидные коллекции', async () => {
        const collections = [
            mockCollection,
            { ...mockCollection, id: '2', owner: null },
        ];
        (prisma.collection.findMany as any).mockResolvedValue(collections);

        const result = await collectionService.collectionService.getCollections();

        expect(result).toHaveLength(1);
    });
});