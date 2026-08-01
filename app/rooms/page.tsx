"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";

type Room = {
  slug: string;
  name: string;
  description: string;
  created_by: number | null;
  member_count: number;
  is_member: boolean;
  created_at: string;
};

export default function RoomsPage() {
  const { tokens, apiRequest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Room[]>("/api/rooms/");
      setRooms(data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (tokens) {
      refresh();
    }
  }, [tokens, refresh]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCreateError("");
    try {
      const room = await apiRequest<Room>("/api/rooms/", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      setRooms((prev) => [room, ...prev]);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create room"
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleMembership(room: Room) {
    try {
      await apiRequest(`/api/rooms/${room.slug}/${room.is_member ? "leave" : "join"}/`, {
        method: "POST",
      });
      setRooms((prev) =>
        prev.map((r) =>
          r.slug === room.slug
            ? {
                ...r,
                is_member: !r.is_member,
                member_count: r.is_member
                  ? r.member_count - 1
                  : r.member_count + 1,
              }
            : r
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update membership"
      );
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
            to browse and join rooms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page stack">
      <div className="page-head">
        <h1 className="page-head__title">Rooms</h1>
        <p className="page-head__lede">
          Join a room to receive notifications from anyone in it. Rooms are
          open — subscribing is one click.
        </p>
      </div>

      <form onSubmit={handleCreate} className="panel stack">
        <div className="field">
          <label htmlFor="room-name" className="field-label">
            Room name
          </label>
          <input
            id="room-name"
            className="input"
            required
            placeholder="e.g. Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="room-desc" className="field-label">
            Description
          </label>
          <textarea
            id="room-desc"
            className="textarea"
            placeholder="What is this room for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={busy}
          data-state={busy ? "loading" : undefined}
        >
          <span className="btn-label">Create room</span>
        </button>

        {createError && (
          <p className="field-error" role="alert">
            {createError}
          </p>
        )}
      </form>

      <div className="toolbar">
        <span className="toolbar__label">
          all rooms · {rooms.length}
        </span>
      </div>

      {error && (
        <div className="panel" role="alert">
          <p className="field-error">{error}</p>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      )}

      {!error && loading && rooms.length === 0 && (
        <div aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      )}

      {!error && !loading && rooms.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__label">No rooms yet</p>
          <p className="empty-state__text">
            Create the first room above, or wait for someone else to.
          </p>
        </div>
      )}

      {rooms.length > 0 && (
        <ul className="list">
          {rooms.map((room) => (
            <li key={room.slug} className="list-row">
              <div className="list-row__main">
                <Link
                  href={`/rooms/${room.slug}`}
                  className="list-row__title"
                >
                  {room.name}
                </Link>
                <div className="list-row__meta">
                  <span>#{room.slug}</span>
                  <span>
                    {room.member_count} member{room.member_count === 1 ? "" : "s"}
                  </span>
                  {room.is_member && <span className="is-read">joined</span>}
                </div>
              </div>
              <div className="list-row__aside">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => toggleMembership(room)}
                >
                  {room.is_member ? "Leave" : "Join"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
