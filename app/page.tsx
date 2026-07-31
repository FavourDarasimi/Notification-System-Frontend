"use client";

import Pusher from "pusher-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Notification = {
  id: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).user_id ?? null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const { tokens, logout, apiRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [pusherStatus, setPusherStatus] = useState("connecting");

  const refreshList = useCallback(async () => {
    try {
      const [listData, countData] = await Promise.all([
        apiRequest<{ results?: Notification[] }>("/api/notifications/"),
        apiRequest<{ count: number }>("/api/notifications/unread-count/"),
      ]);
      setNotifications((listData.results ?? []) as Notification[]);
      setUnreadCount(countData.count);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [apiRequest]);

  useEffect(() => {
    if (tokens) {
      refreshList();
    }
  }, [tokens, refreshList]);

  useEffect(() => {
    if (!tokens) {
      setPusherStatus("logged out");
      return;
    }

    const userId = getUserIdFromToken(tokens.access);
    if (userId == null) {
      setPusherStatus("no user id");
      return;
    }

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      setPusherStatus("not configured");
      return;
    }

    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: `${getApiBaseUrl()}/api/pusher/auth/`,
        transport: "ajax",
        headers: { Authorization: `Bearer ${tokens.access}` },
      },
    });

    const channel = pusher.subscribe(`private-user-${userId}`);

    channel.bind("new-notification", (n: Notification) => {
      setNotifications((prev) => [
        n,
        ...prev.filter((item) => item.id !== n.id),
      ]);
      setUnreadCount((c) => c + 1);
    });

    pusher.connection.bind("connected", () => setPusherStatus("connected"));
    pusher.connection.bind("error", () => setPusherStatus("error"));

    return () => {
      pusher.disconnect();
    };
  }, [tokens]);

  const markRead = useCallback(
    async (id: string, current: boolean) => {
      if (current) return;
      await apiRequest(`/api/notifications/${id}/read/`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [apiRequest]
  );

  const markAllRead = useCallback(async () => {
    await apiRequest("/api/notifications/mark-all-read/", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [apiRequest]);

  if (!tokens) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to view notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Link href="/trigger" className="rounded border px-3 py-1 text-sm">
            Trigger
          </Link>
          <button onClick={logout} className="rounded border px-3 py-1 text-sm">
            Log out
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {unreadCount} unread · pusher: {pusherStatus}
        </span>
        <button
          onClick={markAllRead}
          className="rounded border px-3 py-1 text-sm"
        >
          Mark all read
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className="flex items-start justify-between gap-3 rounded border p-3 text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium">{n.notification_type}</span>
              {" — "}
              {n.message}
              <div className="mt-1 text-xs text-zinc-400">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`text-xs ${
                  n.is_read ? "text-zinc-400" : "font-semibold text-blue-600"
                }`}
              >
                {n.is_read ? "read" : "new"}
              </span>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id, n.is_read)}
                  className="rounded border px-2 py-0.5 text-xs"
                >
                  Mark as read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
