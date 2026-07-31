"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth-context";

type Preference = {
  notification_type: string;
  in_app: boolean;
  email: boolean;
};

type Result = { ok: boolean; text: string };

export default function TriggerPage() {
  const { tokens, apiRequest } = useAuth();
  const [types, setTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tokens) return;
    apiRequest<Preference[]>("/api/notifications/preferences/")
      .then((prefs) => {
        const keys = prefs.map((p) => p.notification_type);
        setTypes(keys);
        setSelected((s) => s || keys[0] || "");
      })
      .catch((err: unknown) =>
        setResult({
          ok: false,
          text: err instanceof Error ? err.message : "Failed to load types",
        })
      );
  }, [tokens, apiRequest]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      await apiRequest("/api/notifications/test/", {
        method: "POST",
        body: JSON.stringify({ notification_type_key: selected, message }),
      });
      setResult({
        ok: true,
        text: `sent · ${selected} · queued for dispatch`,
      });
    } catch (err: unknown) {
      setResult({
        ok: false,
        text: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!tokens) {
    return (
      <div className="container page flex flex-1 flex-col justify-center">
        <div className="empty-state">
          <p className="empty-state__label">auth required</p>
          <p className="empty-state__text">
            <Link href="/login" className="tlink">
              Sign in
            </Link>{" "}
            to trigger notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page stack">
      <div className="page-head">
        <h1 className="page-head__title">Trigger a notification</h1>
        <p className="page-head__lede">
          Sends a test notification through the dispatch pipeline to the
          current user.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel stack">
        <div className="field">
          <label htmlFor="type" className="field-label">
            Notification type
          </label>
          <div className="select-wrap">
            <select
              id="type"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={types.length === 0}
            >
              {types.length === 0 && <option value="">No types loaded</option>}
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <p className="field-help">
            {types.length === 0
              ? "No notification types found for this account."
              : "The registered key of the notification type."}
          </p>
        </div>

        <div className="field">
          <label htmlFor="message" className="field-label">
            Message
          </label>
          <textarea
            id="message"
            className="textarea"
            required
            placeholder="Hello from the trigger page"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="field-help">Shown in the inbox and pushed to the channel.</p>
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={busy || types.length === 0}
          data-state={busy ? "loading" : undefined}
        >
          <span className="btn-label">Send notification</span>
        </button>

        {result && (
          <p
            className={result.ok ? "field-help" : "field-error"}
            role={result.ok ? "status" : "alert"}
          >
            {result.text}
          </p>
        )}
      </form>
    </div>
  );
}
