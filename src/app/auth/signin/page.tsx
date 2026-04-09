"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function toRussianSignInError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid credentials") || text.includes("invalid email") && text.includes("password")) {
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

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email.trim() || !password.trim()) {
      setError("Введите email и пароль.");
      return;
    }
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        throw new Error(result.error.message || "Ошибка входа");
      }
      setSuccess("Успешный вход");
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка входа";
      setError(toRussianSignInError(message));
    }
  };

  return (
    <section className="stack">
      <div className="card">
        <h2>Вход</h2>
        <div className="stack">
          <input
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button onClick={handleSubmit}>Войти</button>
          {error && <p>{error}</p>}
          {success && <p>{success}</p>}
        </div>
      </div>
    </section>
  );
}
