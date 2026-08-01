"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const { tokens, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="app-header">
      <Link href="/" className="wordmark">
        Notify
      </Link>

      {tokens && (
        <nav className="app-nav" aria-label="App">
          <Link
            href="/"
            className={`nav-link ${pathname === "/" ? "is-active" : ""}`}
          >
            Inbox
          </Link>
          <Link
            href="/rooms"
            className={`nav-link ${
              pathname.startsWith("/rooms") ? "is-active" : ""
            }`}
          >
            Rooms
          </Link>
          <Link
            href="/trigger"
            className={`nav-link ${pathname === "/trigger" ? "is-active" : ""}`}
          >
            Trigger
          </Link>
          <button
            type="button"
            onClick={logout}
            className="btn btn--ghost btn--small"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
