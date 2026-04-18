import { expect, test } from "@playwright/test";
import {
  buildCollectionName,
  buildSnippetTitle,
  buildUserCredentials,
  createSnippet,
  deleteCurrentAccount,
  deleteSnippetByUrl,
  signUp,
} from "./fixtures";

test("collections: создание папки и добавление или удаление сниппетов", async ({
  page,
}) => {
  const owner = buildUserCredentials("collections-owner");
  await signUp(page, owner);

  const firstSnippetTitle = buildSnippetTitle("collections-first");
  const secondSnippetTitle = buildSnippetTitle("collections-second");

  const firstSnippetUrl = await createSnippet(page, {
    title: firstSnippetTitle,
    code: "const collectionSource = true;",
  });
  const secondSnippetUrl = await createSnippet(page, {
    title: secondSnippetTitle,
    code: "const anotherCollectionSource = true;",
  });

  await page.goto("/collections");
  const collectionName = buildCollectionName("main");
  await page.getByPlaceholder("Название").fill(collectionName);
  await page.getByRole("button", { name: firstSnippetTitle }).click();
  await page.getByRole("button", { name: "Создать папку" }).click();

  const folderCard = page.locator(".folder-card", { hasText: collectionName });
  await expect(folderCard).toBeVisible();
  await folderCard.click();

  await expect(page).toHaveURL(/\/collections\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: collectionName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Добавить сниппеты" })).toBeVisible();
  await expect(page.getByRole("heading", { name: firstSnippetTitle })).toBeVisible();

  await page.getByRole("button", { name: secondSnippetTitle }).click();
  await page.getByRole("button", { name: "Обновить" }).click();
  await expect(page.getByRole("heading", { name: secondSnippetTitle })).toBeVisible();

  await page.getByRole("button", { name: `${firstSnippetTitle} (в папке)` }).click();
  await page.getByRole("button", { name: "Обновить" }).click();
  await expect(page.getByRole("heading", { name: firstSnippetTitle })).toHaveCount(0);
  await deleteSnippetByUrl(page, secondSnippetUrl);
  await deleteSnippetByUrl(page, firstSnippetUrl);
  await deleteCurrentAccount(page);
});

