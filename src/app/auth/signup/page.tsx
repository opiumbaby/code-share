"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) {
        throw new Error(result.error.message || "Ошибка регистрации");
      }
      setSuccess("Регистрация завершена");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
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
