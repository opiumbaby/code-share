import { prisma } from "../prisma";

interface CreateCommentData {
    text: string;
    authorId: string;
    snippetId: string;
}

export const commentService = {
    async createComment(data: CreateCommentData) {
        return await prisma.comment.create({
            data: {
                text: data.text,
                authorId: data.authorId,
                snippetId: data.snippetId,
            },
        });
    },
    //по конкретному сиппету если передан id
    async getComments(snippetId?: string, authorId?: string, languageId?: string) {
        const where: any = {};

        if (snippetId) {
            where.snippetId = snippetId;
        }

        if (authorId) {
            where.authorId = authorId;
        }

        if (languageId) {
            where.snippet = { languageId };
        }

        const comments = await prisma.comment.findMany({
            where,
            include: {
                author: true,
                snippet: true,
            },
        });
        //фильтруем чтобы не было комментариев без автора или без связанного сниппета
        return comments.filter(c => c.author !== null && c.snippet !== null);
    },
    //делает не обязательным
    async updateComment(id: string, data: Partial<{ text: string }>) {
        return await prisma.comment.update({
            where: { id },
            data,
        });
    },

    async deleteComment(id: string) {
        return await prisma.comment.delete({
            where: { id },
        });
    },
};
