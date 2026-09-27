"use client";
import { useState, useTransition, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Emblem } from "@/components/ui/Emblem";
import { Feedback } from "./Feedback";
export type Result = { ok: boolean; message: string; csv?: string };
export function ActionForm({
  action,
  children,
  label = "Save changes",
  confirm,
  reset = false,
}: {
  action: (data: FormData) => Promise<Result>;
  children?: ReactNode;
  label?: string;
  confirm?: string;
  reset?: boolean;
}) {
  const notify = useContext(Feedback);
  const [result, setResult] = useState<Result | null>(null),
    [pending, start] = useTransition(),
    router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const form = e.currentTarget,
          data = new FormData(form);
        setResult(null);
        start(async () => {
          try {
            const next = await action(data);
            setResult(next);
            if (next.ok) {
              notify(next.message);
              if (next.csv !== undefined) {
                const url = URL.createObjectURL(
                  new Blob([next.csv], { type: "text/csv;charset=utf-8" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "alunsina-newsletter.csv";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }
              if (reset) form.reset();
              router.refresh();
            }
          } catch {
            setResult({
              ok: false,
              message: "The request could not be completed. Please try again.",
            });
          }
        });
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        {children}
        <button type="submit">{pending ? "Working…" : label}</button>
      </fieldset>
      {result && (
        <p className="admin-feedback" role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
export function Counter({
  name,
  label,
  value = "",
  max = 1200,
  sentences = false,
}: {
  name: string;
  label: string;
  value?: string;
  max?: number;
  sentences?: boolean;
}) {
  const [text, setText] = useState(value);
  const count = (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? []).length;
  return (
    <label className="wide">
      {label}
      <textarea
        name={name}
        defaultValue={value}
        maxLength={max}
        required
        onChange={(e) => {
          setText(e.target.value);
          e.target.setCustomValidity(
            sentences &&
              (e.target.value.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [])
                .length > 2
              ? "Use at most two sentences."
              : "",
          );
        }}
      />
      <span className="admin-count" aria-live="polite">
        {text.length}/{max} characters{sentences && ` · ${count}/2 sentences`}
      </span>
    </label>
  );
}
export function ConflictList({ values = [] }: { values?: string[] }) {
  const [rows, setRows] = useState(
      values.map((value, i) => ({ id: i, value })),
    ),
    [next, setNext] = useState(values.length);
  return (
    <div className="wide">
      <p className="admin-muted">Conflicts of interest</p>
      {rows.map((r, i) => (
        <div className="admin-actions" key={r.id}>
          <label style={{ flex: 1 }}>
            Conflict {i + 1}
            <input
              name="conflicts"
              maxLength={500}
              value={r.value}
              onChange={(e) =>
                setRows(
                  rows.map((x) =>
                    x.id === r.id ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
          >
            Remove conflict {i + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mt-2"
        disabled={rows.length >= 30}
        onClick={() => {
          setRows([...rows, { id: next, value: "" }]);
          setNext(next + 1);
        }}
      >
        Add conflict
      </button>
    </div>
  );
}
export function LoginForm() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <div className="admin-login">
      <Emblem className="mb-5 text-forest" />
      <p className="admin-kicker">ALUNSINA NEWS · EDITION DESK</p>
      <h1>Admin sign in</h1>
      <p className="admin-intro">
        Manage the edition, contributors, and reporting in progress.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: data.get("password") }),
            });
            if (!res.ok) {
              setError(
                res.status === 429
                  ? "Too many attempts. Please wait 15 minutes before trying again."
                  : res.status === 401
                    ? "Incorrect password. Please try again."
                    : "Sign in is unavailable. Check the admin configuration.",
              );
            } else {
              router.replace("/admin");
              router.refresh();
            }
          } catch {
            setError("Unable to connect. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
        </label>
        {error && (
          <p className="admin-feedback" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-5 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="admin-muted mt-8">Restricted to the site owner.</p>
    </div>
  );
}
