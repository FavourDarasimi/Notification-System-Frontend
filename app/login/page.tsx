"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, tokens } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tokens) {
      router.replace("/");
    }
  }, [tokens, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page flex flex-1 flex-col justify-center">
      <div className="panel mx-auto w-full max-w-sm">
        <div className="stack">
          <div className="page-head">
            <h1 className="page-head__title">Sign in</h1>
            <p className="page-head__lede">
              Access the notification client with your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            <div className="field">
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="input"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="field-help">The email of the account.</p>
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p
                className={error ? "field-error" : "field-help"}
                role={error ? "alert" : undefined}
              >
                {error || "The password for that account."}
              </p>
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={busy}
              data-state={busy ? "loading" : undefined}
            >
              <span className="btn-label">Sign in</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
