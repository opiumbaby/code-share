import { expect, test } from "@playwright/test";
import {
  buildUserCredentials,
  createSnippet,
  deleteCurrentAccount,
  deleteSnippetByUrl,
  signUp,
} from "./fixtures";

test("search: поиск по названию и фильтр по тегу", async ({ page }) => {
  const user = buildUserCredentials("search-filters");
  await signUp(page, user);

  const suffix = Date.now().toString(36);
  const targetTitle = `test-snippet-search-target-${suffix}`;
  const secondaryTitle = `test-snippet-search-secondary-${suffix}`;
  const targetTag = `test-tag-search-${suffix}`;
  const secondaryTag = `test-tag-beta-${suffix}`;

  const targetSnippetUrl = await createSnippet(page, {
    title: targetTitle,
    code: "const searchTarget = true;",
    tags: `${targetTag}, test-tag-alpha`,
  });
  const secondarySnippetUrl = await createSnippet(page, {
    title: secondaryTitle,
    code: "const searchSecondary = true;",
    tags: secondaryTag,
  });

  await page.goto("/");

  await page.getByPlaceholder("Поиск по названию или коду").fill(targetTitle);
  await expect(page.locator("a.card-link h3").filter({ hasText: targetTitle })).toHaveCount(1);
  await expect(page.locator("a.card-link h3").filter({ hasText: secondaryTitle })).toHaveCount(0);

  await page.getByPlaceholder("Поиск по названию или коду").fill("");
  await page.getByPlaceholder("Фильтр по тегу").fill(secondaryTag);
  await expect(page.locator("a.card-link h3").filter({ hasText: secondaryTitle })).toHaveCount(1);
  await expect(page.locator("a.card-link h3").filter({ hasText: targetTitle })).toHaveCount(0);
  await deleteSnippetByUrl(page, secondarySnippetUrl);
  await deleteSnippetByUrl(page, targetSnippetUrl);
  await deleteCurrentAccount(page);
});

