import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as snippetService from '../services/snippetService';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    snippet: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('SnippetService', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockSnippet = {
    id: '1',
    title: 'Test',
    code: 'code',
    author: { id: 'u1', name: 'John' },
    language: { id: 'js', name: 'JS' },
    comments: [],
  };

  it('создает сниппет', async () => {
    (prisma.snippet.create as any).mockResolvedValue(mockSnippet);
    
    const result = await snippetService.createSnippetService({
      title: 'Test',
      code: 'code',
    });

    expect(result).toEqual(mockSnippet);
  });

  it('получает все сниппеты', async () => {
    (prisma.snippet.findMany as any).mockResolvedValue([mockSnippet]);
    
    const result = await snippetService.getSnippetsService();

    expect(result).toHaveLength(1);
  });

  it('фильтрует по тегу', async () => {
    (prisma.snippet.findMany as any).mockResolvedValue([mockSnippet]);
    
    await snippetService.getSnippetsService({ tag: 'test' });

    expect(prisma.snippet.findMany).toHaveBeenCalledWith({
      where: { tags: { has: 'test' } },
      include: expect.any(Object),
    });
  });

  it('получает сниппет по ID', async () => {
    (prisma.snippet.findUnique as any).mockResolvedValue(mockSnippet);
    
    const result = await snippetService.getSnippetByIdService('1');

    expect(result).toEqual(mockSnippet);
  });

  it('обновляет сниппет', async () => {
    (prisma.snippet.update as any).mockResolvedValue(mockSnippet);
    
    const result = await snippetService.updateSnippetService('1', { title: 'New' });

    expect(result).toEqual(mockSnippet);
  });

  it('удаляет сниппет', async () => {
    (prisma.snippet.delete as any).mockResolvedValue(mockSnippet);
    
    await snippetService.deleteSnippetService('1');

    expect(prisma.snippet.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});