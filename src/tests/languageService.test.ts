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
        // Задаём поведение create: возвращаем mockLanguage
        (prisma.language.create as any).mockResolvedValue(mockLanguage);

        const result = await languageService.languageService.createLanguage({
            name: 'JavaScript',
            fileExtension: '.js',
        });

        //  Проверяем, что сервис отдал то, что вернул мок
        expect(result).toEqual(mockLanguage);
    });

    it('получает все языки', async () => {
        // findMany вернёт массив из одного языка
        (prisma.language.findMany as any).mockResolvedValue([mockLanguage]);

        const result = await languageService.languageService.getAllLanguages();

        // Проверяем корректность данных
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('JavaScript');
    });

    it('возвращает пустой массив', async () => {
        // Мок возвращает пустой список языков
        (prisma.language.findMany as any).mockResolvedValue([]);

        const result = await languageService.languageService.getAllLanguages();

        // Ожидаем пустой массив
        expect(result).toEqual([]);
    });
});
