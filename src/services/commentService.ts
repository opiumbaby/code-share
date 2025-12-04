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


    async getComments(snippetId?: string) {
        const where: any = {};
        if (snippetId) {
            where.snippetId = snippetId;
        }

        const comments = await prisma.comment.findMany({
            where,
            include: {
                author: true,
                snippet: true,
            },
        });


        return comments.filter(c => c.author !== null && c.snippet !== null);
    },
};