import { prisma } from "../prisma";

interface CreateLanguageData {
    name: string;
    fileExtension: string;
}

export const languageService = {

    async createLanguage(data: CreateLanguageData) {
        return await prisma.language.create({
            data: {
                name: data.name,
                fileExtension: data.fileExtension,
            },
        });
    },


    async getAllLanguages() {
        return await prisma.language.findMany();
    },
};