import { expect, test } from "@playwright/test";
import {
  buildSnippetTitle,
  buildUserCredentials,
  createSnippet,
  deleteCurrentAccount,
  signUp,
} from "./fixtures";

test("snippets: Редактирование и удаление сниппета", async ({ page }) => {
  const owner = buildUserCredentials("snippet-owner");
  await signUp(page, owner);

  const originalTitle = buildSnippetTitle("edit-delete-original");
  const snippetUrl = await createSnippet(page, {
    title: originalTitle,
    code: "const value = 1;",
  });

  await page.getByRole("link", { name: "Редактировать" }).click();
  await expect(page).toHaveURL(/\/snippets\/[0-9a-f-]+\/edit$/);

  const updatedTitle = buildSnippetTitle("edit-delete-updated");
  await expect(
    page.getByPlaceholder("Расширение (.ts, .js, .cpp)")
  ).toHaveValue(/\..+/);
  const titleInput = page.getByPlaceholder("Заголовок");
  await expect(titleInput).toHaveValue(originalTitle);
  await titleInput.fill(updatedTitle);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL("/");

  await page.goto(snippetUrl);
  await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Удалить сниппет" }).click();
  await expect(page).toHaveURL("/");

  await page.goto(snippetUrl);
  await expect(page.getByText("Сниппет не найден")).toBeVisible();
  await deleteCurrentAccount(page);
});
