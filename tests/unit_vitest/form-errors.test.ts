import {
  toRussianProfileUpdateError,
  toRussianSignInError,
  toRussianSignUpError,
} from "../../src/lib/form-errors";

describe("form-errors", () => {
  it("maps sign-in credential errors to russian", () => {
    expect(toRussianSignInError("Invalid credentials")).toBe("Неверный email или пароль.");
    expect(toRussianSignInError("rate limit reached")).toBe(
      "Слишком много попыток. Попробуйте позже."
    );
  });

  it("maps sign-up registration conflicts to russian", () => {
    expect(toRussianSignUpError("email already in use")).toBe(
      "Этот email уже зарегистрирован."
    );
    expect(toRussianSignUpError("invalid email format")).toBe("Неверный формат email.");
  });

  it("maps profile update zod and trpc errors to russian", () => {
    expect(
      toRussianProfileUpdateError({
        data: { zodError: { fieldErrors: { email: ["Invalid"] } } },
      })
    ).toBe("Введите корректный email.");

    expect(toRussianProfileUpdateError({ message: "Username already taken" })).toBe(
      "Этот username уже занят."
    );
    expect(toRussianProfileUpdateError({ message: "Authentication required" })).toBe(
      "Требуется авторизация."
    );
  });
});
