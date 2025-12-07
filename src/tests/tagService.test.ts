import { describe, it, expect, beforeEach } from "vitest";
import * as tagService from "../services/tagService";
import { prisma } from "../prisma";

describe("TagService", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // очищаем моки перед каждым тестом
  });

  const mockTag = {
    id: "1",
    name: "JavaScript",
    createdAt: new Date(),
  };

  it("создаёт тег", async () => {
    // Настраиваем мок возвращаемого значения
    (prisma.tag.create as any).mockResolvedValue(mockTag);

    const result = await tagService.createTagService({ name: "JavaScript" });

    // Проверяем, что prisma вызван правильно
    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { name: "JavaScript" },
    });

    // Проверяем, что сервис вернул нужный результат
    expect(result).toEqual(mockTag);
  });

  it("получает все теги", async () => {
    const mockTags = [
      mockTag,
      { id: "2", name: "Python", createdAt: new Date() },
    ];

    (prisma.tag.findMany as any).mockResolvedValue(mockTags);

    const result = await tagService.getTagsService();

    expect(prisma.tag.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it("получает тег по ID", async () => {
    (prisma.tag.findUnique as any).mockResolvedValue(mockTag);

    const result = await tagService.getTagByIdService("1");

    expect(prisma.tag.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockTag);
  });

  it("возвращает null если тег не найден", async () => {
    (prisma.tag.findUnique as any).mockResolvedValue(null);

    const result = await tagService.getTagByIdService("nonexistent");

    expect(result).toBeNull();
  });

  it("обновляет тег", async () => {
    const updatedTag = { ...mockTag, name: "TypeScript" };

    (prisma.tag.update as any).mockResolvedValue(updatedTag);

    const result = await tagService.updateTagService("1", {
      name: "TypeScript",
    });

    expect(prisma.tag.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "TypeScript" },
    });
    expect(result).toEqual(updatedTag);
  });

  it("удаляет тег", async () => {
    (prisma.tag.delete as any).mockResolvedValue(mockTag);

    await tagService.deleteTagService("1");

    expect(prisma.tag.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
