"use client";
import Link from "next/link";
import { Emblem } from "@/components/ui/Emblem";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Feedback } from "./Feedback";
const pages = [
  "Overview",
  "Contributors",
  "Pitches",
  "Flags",
  "Stories",
  "Sources",
  "Commentary",
  "Newsletter",
  "Audit",
];
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (path === "/admin/login")
    return <div className="admin-ui">{children}</div>;
  return (
    <Feedback.Provider value={setNotice}>
      <div className="admin-ui admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">
            <Emblem className="mb-2" />
            ALUNSINA NEWS<span>EDITION DESK</span>
          </Link>
          <button
            className="admin-menu"
            aria-expanded={open}
            aria-controls="admin-nav"
            onClick={() => setOpen(!open)}
          >
            Menu {open ? "−" : "+"}
          </button>
          <nav
            id="admin-nav"
            className={open ? "is-open" : ""}
            aria-label="Admin navigation"
          >
            {pages.map((name, i) => {
              const href = i ? `/admin/${name.toLowerCase()}` : "/admin";
              return (
                <Link
                  key={name}
                  href={href}
                  aria-current={path === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {name}
                </Link>
              );
            })}
            <Link href="/">View public site ↗</Link>
          </nav>
        </aside>
        <div className="admin-workspace">
          <header className="admin-header">
            <span>Signed in as admin</span>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await fetch("/api/admin/logout", {
                    method: "POST",
                  });
                  if (!res.ok)
                    throw new Error("Could not log out. Please retry.");
                  router.replace("/admin/login");
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              Log out
            </button>
          </header>
          {error && <p role="alert">{error}</p>}
          <div className="admin-content">
            {notice && (
              <div className="admin-feedback" role="status">
                {notice}
                <button
                  type="button"
                  className="ml-3"
                  onClick={() => setNotice("")}
                >
                  Dismiss notification
                </button>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </Feedback.Provider>
  );
}
