import { expect, test } from "@playwright/test";
import {
  buildSnippetTitle,
  buildUserCredentials,
  createSnippet,
  deleteCurrentAccount,
  deleteSnippetByUrl,
  signIn,
  signOut,
  signUp,
} from "./fixtures";

test("favorites: добавление сниппета в избранное", async ({ page }) => {
  const owner = buildUserCredentials("favorites-owner");
  await signUp(page, owner);

  const snippetUrl = await createSnippet(page, {
    title: buildSnippetTitle("favorites"),
    code: "export const hello = 'world';",
  });

  await signOut(page);

  const secondUser = buildUserCredentials("favorites-second-user");
  await signUp(page, secondUser);
  await page.goto(snippetUrl);

  await page.getByRole("button", { name: "Добавить в избранное" }).click();
  await expect(page.getByRole("button", { name: "В избранном" })).toBeVisible();

  await page.getByRole("button", { name: "В избранном" }).click();
  await expect(page.getByRole("button", { name: "Добавить в избранное" })).toBeVisible();
  await deleteCurrentAccount(page);
  await signIn(page, owner);
  await deleteSnippetByUrl(page, snippetUrl);
  await deleteCurrentAccount(page);
});

