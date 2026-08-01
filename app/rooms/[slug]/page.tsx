"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

type Member = {
  user_id: number;
  email: string;
  joined_at: string;
};

type Detail = { room: Room; members: Member[] };

export default function RoomDetailPage() {
  const params = useParams<{ slug: string }>();
  const { tokens, apiRequest } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Detail>(`/api/rooms/${params.slug}/`);
      setDetail(data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, params.slug]);

  useEffect(() => {
    if (tokens) {
      refresh();
    }
  }, [tokens, refresh]);

  async function toggleMembership() {
    if (!detail) return;
    const action = detail.room.is_member ? "leave" : "join";
    try {
      await apiRequest(`/api/rooms/${detail.room.slug}/${action}/`, {
        method: "POST",
      });
      refresh();
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
            to view this room.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page stack">
      <Link href="/rooms" className="tlink">
        ← All rooms
      </Link>

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

      {!error && loading && !detail && (
        <div aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      )}

      {!error && detail && (
        <>
          <section className="status-band" aria-label="Room status">
            <div className="status-band__stat">
              <span className="status-band__label">{detail.room.name}</span>
              <span className="status-band__value">
                #{detail.room.slug}
              </span>
            </div>
            <div className="status-band__readout">
              <span className={detail.room.is_member ? "is-live" : ""}>
                {detail.room.is_member ? "member" : "not joined"}
              </span>
              <span>{detail.room.member_count} members</span>
            </div>
          </section>

          {detail.room.description && (
            <p>{detail.room.description}</p>
          )}

          <div className="toolbar">
            <span className="toolbar__label">Members</span>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={toggleMembership}
            >
              {detail.room.is_member ? "Leave room" : "Join room"}
            </button>
          </div>

          {detail.members.length > 0 && (
            <ul className="list">
              {detail.members.map((member) => (
                <li key={member.user_id} className="list-row">
                  <div className="list-row__main">
                    <p className="list-row__message">{member.email}</p>
                    <div className="list-row__meta">
                      <span>joined {new Date(member.joined_at).toLocaleString()}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {detail.members.length === 0 && (
            <div className="empty-state">
              <p className="empty-state__label">No members</p>
              <p className="empty-state__text">
                Be the first to join this room.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
