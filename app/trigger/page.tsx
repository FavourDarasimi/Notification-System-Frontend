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
        text: `Sent "${message}" (${selected}). Watch the / page.`,
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
      <div className="flex flex-1 items-center justify-center">
        <p>
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to trigger notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trigger notification</h1>
        <Link href="/" className="rounded border px-3 py-1 text-sm">
          ← Notifications
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Notification type
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="border px-3 py-2 text-sm"
          >
            {types.length === 0 && <option value="">No types loaded</option>}
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={3}
            placeholder="Hello from the trigger page"
            className="border px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={busy || types.length === 0}
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </form>

      {result && (
        <p
          className={`text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}
          role="status"
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
