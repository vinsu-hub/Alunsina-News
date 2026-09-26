"use client";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { FlagInput } from "@/lib/types";

export function FlagButton({ kind, storyId, targetId }: Pick<FlagInput, "kind" | "storyId" | "targetId">) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    try {
      const response = await fetch("/api/flags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, storyId, targetId, note }) });
      setState(response.ok ? "done" : "error");
    } catch { setState("error"); }
  }
  if (state === "done") return <p role="status" className="meta mt-3">Thanks, flagged for review. <Link href="/methodology#corrections" className="text-forest underline">How corrections work →</Link></p>;
  return <div className="mt-3 font-sans text-xs">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="text-ink-muted underline underline-offset-4 hover:text-ink">This doesn&apos;t belong here</button>
    {open && <form id={id} onSubmit={submit} className="mt-3 border border-rule p-3">
      <label htmlFor={`${id}-note`} className="block text-ink-soft">Optional note (up to 500 characters)</label>
      <textarea id={`${id}-note`} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full min-w-0 border border-rule bg-paper p-2 text-ink" />
      <button disabled={state === "sending"} className="mt-2 border border-ink px-3 py-2 disabled:opacity-50">{state === "sending" ? "Sending…" : "Flag for review"}</button>
      {state === "error" && <p role="alert" className="mt-2 text-terracotta">Could not send your flag. Please try again in a moment.</p>}
    </form>}
  </div>;
}
