"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function toRussianSignUpError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("email already") || text.includes("already registered") || text.includes("already in use")) {
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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Заполните имя, email и пароль.");
      return;
    }
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) {
        throw new Error(result.error.message || "Ошибка регистрации");
      }
      setSuccess("Регистрация завершена");
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка регистрации";
      setError(toRussianSignUpError(message));
    }
  };

  return (
    <section className="stack">
      <div className="card">
        <h2>Регистрация</h2>
        <div className="stack">
          <input
            placeholder="Имя"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
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
          <button onClick={handleSubmit}>Создать аккаунт</button>
          {error && <p>{error}</p>}
          {success && <p>{success}</p>}
        </div>
      </div>
    </section>
  );
}
