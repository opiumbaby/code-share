import { expect, test } from "@playwright/test";
import { buildUserCredentials, deleteCurrentAccount, signIn, signOut, signUp } from "./fixtures";

test("auth: регистрация, вход и выход", async ({ page }) => {
  const user = buildUserCredentials("auth-flow");

  await signUp(page, user);
  await signOut(page);
  await signIn(page, user);
  await deleteCurrentAccount(page);
});

