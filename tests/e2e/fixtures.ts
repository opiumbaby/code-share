import { expect, type Page } from "@playwright/test";

export type Credentials = {
  name: string;
  email: string;
  password: string;
};

function buildUniqueSuffix() {
  return Date.now().toString(36);
}

export function buildUserCredentials(role: string): Credentials {
  const safeRole = role.replace(/\s+/g, "-").toLowerCase();
  const timestamp = buildUniqueSuffix();
  const roleNameMap: Record<string, string> = {
    "snippet-owner": "test-user-owner",
    "favorites-owner": "test-user-owner",
    "collections-owner": "test-user-owner",
    "favorites-second-user": "test-user-viewer",
    "search-filters": "test-user-viewer",
    "auth-flow": "test-user-author",
    "snippet-create": "test-user-author",
    "comments-author": "test-user-author",
  };
  const username = roleNameMap[safeRole] ?? `test-user-${safeRole}`;

  return {
    name: username,
    email: `${username}-${timestamp}@example.com`,
    password: "Pass12345!",
  };
}

export function buildSnippetTitle(purpose: string) {
  const safePurpose = purpose.replace(/\s+/g, "-").toLowerCase();
  const snippetTitleMap: Record<string, string> = {
    "invalid-extension": "test-snippet-create",
    favorites: "test-snippet-create",
    comments: "test-snippet-create",
    "search-target": "test-snippet-create",
    "search-secondary": "test-snippet-create-secondary",
    "edit-delete-original": "test-snippet-edit",
    "edit-delete-updated": "test-snippet-edit-updated",
    "collections-first": "test-snippet-create",
    "collections-second": "test-snippet-edit",
  };

  return snippetTitleMap[safePurpose] ?? `test-snippet-${safePurpose}`;
}

export function buildCollectionName(purpose: string) {
  const safePurpose = purpose.replace(/\s+/g, "-").toLowerCase();
  if (safePurpose === "main") {
    return "test-collection-main";
  }
  return `test-collection-${safePurpose}`;
}

export function buildCommentText(purpose: string) {
  const safePurpose = purpose.replace(/\s+/g, "-").toLowerCase();
  const timestamp = buildUniqueSuffix();
  return `test-comment-${safePurpose}-${timestamp}`;
}

export async function signUp(page: Page, credentials: Credentials) {
  await page.goto("/auth/signup");
  await page.getByPlaceholder("Имя").fill(credentials.name);
  await page.getByPlaceholder("Email").fill(credentials.email);
  await page.getByPlaceholder("Пароль").fill(credentials.password);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
}

export async function signIn(page: Page, credentials: Credentials) {
  await page.goto("/auth/signin");
  await page.getByPlaceholder("Email").fill(credentials.email);
  await page.getByPlaceholder("Пароль").fill(credentials.password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
}

export async function deleteCurrentAccount(page: Page) {
  await page.goto("/profile");
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Удалить аккаунт" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
}

export async function deleteSnippetByUrl(page: Page, snippetUrl: string) {
  await page.goto(snippetUrl);
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Удалить сниппет" }).click();
  await expect(page).toHaveURL("/");
}

export async function createSnippet(
  page: Page,
  data: { title: string; code: string; extension?: string; tags?: string }
) {
  await page.goto("/snippets/new");
  await expect(page.getByRole("heading", { name: "Новый сниппет" })).toBeVisible();
  await page.getByPlaceholder("Заголовок").fill(data.title);
  await page.getByPlaceholder("Код").fill(data.code);
  await page
    .getByPlaceholder("Или введите расширение (.ts, .js, .cpp)")
    .fill(data.extension ?? ".ts");
  if (data.tags) {
    await page.getByPlaceholder("Теги через запятую").fill(data.tags);
  }
  await page.getByRole("button", { name: "Создать" }).click();
  const authRaceError = page.getByText("Нужна авторизация.");
  if (await authRaceError.isVisible().catch(() => false)) {
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Создать" }).click();
  }
  await expect(page).toHaveURL(/\/snippets\/[0-9a-f-]+$/);
  return page.url();
}

