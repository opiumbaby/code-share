"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toRussianSignInError } from "@/lib/form-errors";

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
