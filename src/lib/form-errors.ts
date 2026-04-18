export function toRussianSignInError(message: string) {
  const text = message.toLowerCase();
  if (
    text.includes("invalid credentials") ||
    (text.includes("invalid email") && text.includes("password"))
  ) {
    return "Неверный email или пароль.";
  }
  if (text.includes("user not found")) {
    return "Пользователь не найден.";
  }
  if (text.includes("email not verified") || text.includes("verify")) {
    return "Подтвердите email перед входом.";
  }
  if (text.includes("too many") || text.includes("rate limit")) {
    return "Слишком много попыток. Попробуйте позже.";
  }
  if (text.includes("invalid email") || (text.includes("email") && text.includes("format"))) {
    return "Неверный формат email.";
  }
  if (text.includes("password") && text.includes("required")) {
    return "Введите пароль.";
  }
  return "Не удалось войти. Проверьте данные и попробуйте снова.";
}

export function toRussianSignUpError(message: string) {
  const text = message.toLowerCase();
  if (
    text.includes("email already") ||
    text.includes("already registered") ||
    text.includes("already in use")
  ) {
    return "Этот email уже зарегистрирован.";
  }
  if (text.includes("invalid email") || (text.includes("email") && text.includes("format"))) {
    return "Неверный формат email.";
  }
  if (text.includes("weak password") || text.includes("password too weak")) {
    return "Пароль слишком простой.";
  }
  if (text.includes("password") && text.includes("length")) {
    return "Пароль слишком короткий.";
  }
  if (text.includes("name") && text.includes("required")) {
    return "Введите имя.";
  }
  return "Не удалось создать аккаунт. Проверьте данные и попробуйте снова.";
}

export function toRussianProfileUpdateError(error: unknown) {
  const err = error as any;
  const fieldErrors = err?.data?.zodError?.fieldErrors as
    | Record<string, string[] | undefined>
    | undefined;

  if (fieldErrors?.email?.length) {
    return "Введите корректный email.";
  }
  if (fieldErrors?.username?.length) {
    return "Username должен содержать минимум 2 символа.";
  }

  const message = String(err?.message ?? "").toLowerCase();

  if (message.includes("username already taken")) {
    return "Этот username уже занят.";
  }
  if (message.includes("email already taken")) {
    return "Этот email уже используется.";
  }
  if (message.includes("not owner of profile")) {
    return "Можно обновлять только свой профиль.";
  }
  if (message.includes("authentication required") || message.includes("unauthorized")) {
    return "Требуется авторизация.";
  }
  if (message.includes("invalid email")) {
    return "Введите корректный email.";
  }

  return "Не удалось обновить профиль. Попробуйте еще раз.";
}
