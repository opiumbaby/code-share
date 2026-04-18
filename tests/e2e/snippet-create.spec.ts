import { expect, test } from "@playwright/test";
import {
  buildSnippetTitle,
  buildUserCredentials,
  deleteSnippetByUrl,
  deleteCurrentAccount,
  signUp,
} from "./fixtures";

test("snippets: создание сниппета через файл и проверка расширения", async ({
  page,
}) => {
  const user = buildUserCredentials("snippet-create");
  await signUp(page, user);

  await page.goto("/snippets/new");
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  const codeFromFile = 'print("hello from e2e")\n';

  await fileInput.setInputFiles({
    name: "sample.py",
    mimeType: "text/x-python",
    buffer: Buffer.from(codeFromFile),
  });

  await expect(page.getByPlaceholder("Код")).toHaveValue(codeFromFile);
  await expect(page.getByPlaceholder("Или введите расширение (.ts, .js, .cpp)")).toHaveValue(
    ".py"
  );

  await page.getByPlaceholder("Заголовок").fill(buildSnippetTitle("invalid-extension"));
  const definitelyInvalidExt = ".e2einvalid-ext";
  await page
    .getByPlaceholder("Или введите расширение (.ts, .js, .cpp)")
    .fill(definitelyInvalidExt);
  await page.getByRole("button", { name: "Создать" }).click();

  const authRaceError = page.getByText("Нужна авторизация.");
  if (await authRaceError.isVisible().catch(() => false)) {
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Создать" }).click();
  }

  await expect(page).toHaveURL("/snippets/new");
  await expect(page.getByText("Недопустимое расширение. Выберите из списка.")).toBeVisible();

  await page.getByPlaceholder("Или введите расширение (.ts, .js, .cpp)").fill(".ts");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page).toHaveURL(/\/snippets\/[0-9a-f-]+$/);
  const snippetUrl = page.url();
  await deleteSnippetByUrl(page, snippetUrl);
  await deleteCurrentAccount(page);
});

