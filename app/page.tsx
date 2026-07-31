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

const PUSHER_LABELS: Record<string, string> = {
  connected: "pusher · connected",
  connecting: "pusher · connecting",
  error: "pusher · error",
  "not configured": "pusher · not configured",
  "no user id": "pusher · no user id",
  "logged out": "pusher · logged out",
};

export default function HomePage() {
  const { tokens, apiRequest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pusherStatus, setPusherStatus] = useState("connecting");

  const refreshList = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiRequest(`/api/notifications/${id}/read/`, { method: "PATCH" });
      } catch (err: unknown) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
        );
        setUnreadCount((c) => c + 1);
        setError(err instanceof Error ? err.message : "Failed to mark read");
      }
    },
    [apiRequest]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await apiRequest("/api/notifications/mark-all-read/", { method: "POST" });
    } catch (err: unknown) {
      refreshList();
      setError(err instanceof Error ? err.message : "Failed to mark all read");
    }
  }, [apiRequest, refreshList]);

  if (!tokens) {
    return (
      <div className="container page flex flex-1 flex-col justify-center">
        <div className="empty-state">
          <p className="empty-state__label">auth required</p>
          <p className="empty-state__text">
            <Link href="/login" className="tlink">
              Sign in
            </Link>{" "}
            to view notifications.
          </p>
        </div>
      </div>
    );
  }

  const pusherLabel = PUSHER_LABELS[pusherStatus] ?? pusherStatus;
  const pusherLive =
    pusherStatus === "connected" || pusherStatus === "connecting";
  const pusherBad = pusherStatus === "error";

  return (
    <div className="container page stack">
      <section className="status-band" aria-label="Inbox status">
        <div className="status-band__stat">
          <span className="status-band__label">Unread</span>
          <span className="status-band__value">{unreadCount}</span>
        </div>
        <div className="status-band__readout">
          <span className={pusherLive ? "is-live" : pusherBad ? "is-bad" : ""}>
            {pusherLabel}
          </span>
          <span>total · {notifications.length}</span>
        </div>
      </section>

      <div className="toolbar">
        <span className="toolbar__label">Notifications</span>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </button>
      </div>

      {error && (
        <div className="panel" role="alert">
          <p className="field-error">{error}</p>
          <button type="button" className="btn btn--ghost btn--small" onClick={refreshList}>
            Retry
          </button>
        </div>
      )}

      {!error && loading && notifications.length === 0 && (
        <div aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      )}

      {!error && !loading && notifications.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__label">Inbox empty</p>
          <p className="empty-state__text">
            No notifications yet. Send one from the trigger page.
          </p>
          <Link href="/trigger" className="btn btn--ghost btn--small">
            Trigger one
          </Link>
        </div>
      )}

      {notifications.length > 0 && (
        <ul className="list">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`list-row ${n.is_read ? "" : "is-unread"}`}
            >
              <div className="list-row__main">
                <p className="list-row__message">{n.message}</p>
                <div className="list-row__meta">
                  <span className="list-row__type">
                    {n.notification_type}
                  </span>
                  <span className={n.is_read ? "is-read" : ""}>
                    {n.is_read ? "read" : "new"}
                  </span>
                  <span>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="list-row__aside">
                {!n.is_read && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => markRead(n.id, n.is_read)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
