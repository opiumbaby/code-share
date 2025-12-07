import { describe, it, expect, beforeEach } from 'vitest';
import * as snippetService from '../services/snippetService';
import { prisma } from '../prisma';

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
});
