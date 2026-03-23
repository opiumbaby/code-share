import { prisma } from "../prisma";

interface CreateCollectionData {
    name: string;
    ownerId?: string;
    snippetIds?: string[];
}

export const collectionService = {
    async createCollection(data: CreateCollectionData) {
        return await prisma.collection.create({
            data: {
                name: data.name,
                ownerId: data.ownerId || undefined,
                snippetIds: data.snippetIds || [],
            },
        });
    },

    async getCollections(ownerId?: string) {
        const where: any = {};
        if (ownerId) {
            where.ownerId = ownerId;
        }
        //ищем все записи соответсвующие фильтру
        const collections = await prisma.collection.findMany({
            where,
            include: { owner: true },//так же данные владельца получить
        });

        return collections.filter(collect => collect.owner !== null);
    },
};