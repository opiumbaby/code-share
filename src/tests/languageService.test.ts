import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as languageService from '../services/languageService';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
    prisma: {
        language: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

describe('LanguageService', () => {
    beforeEach(() => vi.clearAllMocks());

    const mockLanguage = {
        id: '507f1f77bcf86cd799439011',
        name: 'JavaScript',
        fileExtension: '.js',
    };

    it('создает язык', async () => {
        (prisma.language.create as any).mockResolvedValue(mockLanguage);

        const result = await languageService.languageService.createLanguage({
            name: 'JavaScript',
            fileExtension: '.js',
        });

        expect(result).toEqual(mockLanguage);
    });

    it('получает все языки', async () => {
        (prisma.language.findMany as any).mockResolvedValue([mockLanguage]);

        const result = await languageService.languageService.getAllLanguages();

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('JavaScript');
    });

    it('возвращает пустой массив', async () => {
        (prisma.language.findMany as any).mockResolvedValue([]);

        const result = await languageService.languageService.getAllLanguages();

        expect(result).toEqual([]);
    });
});