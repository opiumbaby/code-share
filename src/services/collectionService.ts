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

        const collections = await prisma.collection.findMany({
            where,
            include: { owner: true },
        });

        return collections.filter(c => c.owner !== null);
    },
};