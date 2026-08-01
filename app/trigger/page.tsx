"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth-context";

type Preference = {
  notification_type: string;
  in_app: boolean;
  email: boolean;
};

type Room = {
  slug: string;
  name: string;
  member_count: number;
  is_member: boolean;
};

type Result = { ok: boolean; text: string };

export default function TriggerPage() {
  const { tokens, apiRequest } = useAuth();
  const [types, setTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"self" | "room">("self");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSlug, setRoomSlug] = useState("");
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
    apiRequest<Room[]>("/api/rooms/")
      .then((all) => {
        const joined = all.filter((r) => r.is_member);
        setRooms(joined);
        setRoomSlug((s) => s || joined[0]?.slug || "");
      })
      .catch((err: unknown) =>
        setResult({
          ok: false,
          text: err instanceof Error ? err.message : "Failed to load rooms",
        })
      );
  }, [tokens, apiRequest]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    const body = JSON.stringify({ notification_type_key: selected, message });
    try {
      if (target === "self") {
        await apiRequest("/api/notifications/test/", {
          method: "POST",
          body,
        });
        setResult({
          ok: true,
          text: `sent · ${selected} · queued for dispatch`,
        });
      } else {
        const data = await apiRequest<{ count: number }>(
          `/api/rooms/${roomSlug}/send/`,
          { method: "POST", body }
        );
        setResult({
          ok: true,
          text:
            data.count > 0
              ? `sent to #${roomSlug} · ${data.count} queued for dispatch`
              : `sent to #${roomSlug} · no other members to reach`,
        });
      }
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
          Sends a test notification through the dispatch pipeline — to the
          current user, or to every other member of a room you&apos;ve joined.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel stack">
        <div className="field">
          <label htmlFor="target" className="field-label">
            Target
          </label>
          <div className="select-wrap">
            <select
              id="target"
              value={target}
              onChange={(e) =>
                setTarget(e.target.value as "self" | "room")
              }
            >
              <option value="self">To me</option>
              <option value="room">To a room</option>
            </select>
          </div>
          <p className="field-help">
            Room notifications reach every other member of the room.
          </p>
        </div>

        {target === "room" && (
          <div className="field">
            <label htmlFor="room" className="field-label">
              Room
            </label>
            {rooms.length === 0 ? (
              <p className="field-help">
                You haven&apos;t joined any rooms yet.{" "}
                <Link href="/rooms" className="tlink">
                  Browse rooms
                </Link>{" "}
                to subscribe to one.
              </p>
            ) : (
              <>
                <div className="select-wrap">
                  <select
                    id="room"
                    value={roomSlug}
                    onChange={(e) => setRoomSlug(e.target.value)}
                  >
                    {rooms.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        #{r.slug} · {r.member_count} member
                        {r.member_count === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="field-help">
                  Only rooms you&apos;ve joined appear here.
                </p>
              </>
            )}
          </div>
        )}

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
          disabled={busy || types.length === 0 || (target === "room" && rooms.length === 0)}
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
