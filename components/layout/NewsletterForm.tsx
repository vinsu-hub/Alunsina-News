"use client";
import { useState, type FormEvent } from "react";
export function NewsletterForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: new FormData(form).get("email") }),
      });
      const data = await r.json();
      setStatus(
        r.ok
          ? "Signup recorded. Email delivery is not active yet."
          : (data.error ?? "Unable to sign up. Please try again."),
      );
      if (r.ok) form.reset();
    } catch {
      setStatus("Unable to sign up. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      id="newsletter"
      action="/api/newsletter"
      method="post"
      onSubmit={submit}
    >
      <label htmlFor="newsletter-email" className="block text-sm">
        Sign up for the Spotlight Newsletter
      </label>
      <div className="mt-3 flex gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="Your email address"
          autoComplete="email"
          className="min-w-0 flex-1 border border-rule bg-transparent px-3 py-2 font-serif text-sm"
        />
        <button
          disabled={busy}
          className="shrink-0 bg-forest px-3 py-2 text-[10px] text-paper"
        >
          {busy ? "SAVING…" : "SIGN UP"}
        </button>
      </div>
      <p role="status" className="mt-2 text-xs text-ink-soft">
        {status}
      </p>
      <p className="mt-2 text-[10px] text-ink-muted">
        We record your interest; email delivery is not active yet.
      </p>
    </form>
  );
}
