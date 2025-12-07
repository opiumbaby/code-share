import { describe, it, expect, beforeEach } from 'vitest';
import * as languageService from '../services/languageService';
import { prisma } from '../prisma';

describe('LanguageService', () => {
    beforeEach(() => {
        // Очищаем моки перед каждым тестом
        vi.clearAllMocks();
    });

    // Пример тестового языка
    const mockLanguage = {
        id: '507f1f77bcf86cd799439011',
        name: 'JavaScript',
        fileExtension: '.js',
    };

    it('создаёт язык', async () => {
        // Мокаем результат создания языка
        (prisma.language.create as any).mockResolvedValue(mockLanguage);

        const result = await languageService.languageService.createLanguage({
            name: 'JavaScript',
            fileExtension: '.js',
        });

        // Проверяем, что prisma вызван с нужными данными
        expect(prisma.language.create).toHaveBeenCalledWith({
            data: {
                name: 'JavaScript',
                fileExtension: '.js',
            },
        });

        expect(result).toEqual(mockLanguage);
    });

    it('получает все языки', async () => {
        // Мокаем список языков
        const mockLanguages = [
            mockLanguage,
            { id: '507f1f77bcf86cd799439012', name: 'Python', fileExtension: '.py' },
        ];

        (prisma.language.findMany as any).mockResolvedValue(mockLanguages);

        const result = await languageService.languageService.getAllLanguages();

        // Проверяем, что запрос был отправлен
        expect(prisma.language.findMany).toHaveBeenCalled();

        // Убеждаемся что массив корректный
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('JavaScript');
    });

    it('возвращает пустой массив', async () => {
        // Ситуация когда в БД нет языков
        (prisma.language.findMany as any).mockResolvedValue([]);

        const result = await languageService.languageService.getAllLanguages();

        expect(result).toEqual([]);
    });
});
