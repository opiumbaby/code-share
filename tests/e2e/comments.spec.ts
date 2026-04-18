import { expect, test } from "@playwright/test";
import {
  buildCommentText,
  buildSnippetTitle,
  buildUserCredentials,
  createSnippet,
  deleteCurrentAccount,
  deleteSnippetByUrl,
  signUp,
} from "./fixtures";

test("comments: добавление, редактирование и удаление комментария", async ({ page }) => {
  const author = buildUserCredentials("comments-author");
  await signUp(page, author);

  const snippetUrl = await createSnippet(page, {
    title: buildSnippetTitle("comments"),
    code: "console.log('comments');",
  });

  const commentText = buildCommentText("initial");
  await page.getByPlaceholder("Оставьте комментарий").fill(commentText);
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText(commentText)).toBeVisible();

  const updatedComment = buildCommentText("updated");
  await page
    .locator("li.comment", { hasText: commentText })
    .first()
    .getByRole("button", { name: "Редактировать" })
    .click();
  await page.locator("li.comment textarea").first().fill(updatedComment);
  await page
    .locator("li.comment")
    .filter({ has: page.locator("textarea") })
    .first()
    .getByRole("button", { name: "Сохранить" })
    .click();
  await expect(page.getByText(updatedComment)).toBeVisible();

  const updatedCommentItem = page.locator("li.comment", { hasText: updatedComment }).first();
  await updatedCommentItem.getByRole("button", { name: "Удалить" }).click();
  await expect(page.getByText(updatedComment)).toHaveCount(0);
  await deleteSnippetByUrl(page, snippetUrl);
  await deleteCurrentAccount(page);
});

