"use client";

import { useState } from "react";
import { THEME } from "@/lib/constants";

export function MentorProfileConnect({
  mentorId,
  mentorName,
  hasActiveRequestInitially,
}: {
  mentorId: string;
  mentorName: string;
  hasActiveRequestInitially: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(hasActiveRequestInitially);

  async function submit() {
    if (sending || requested) return;
    const trimmed = message.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      setError("Message must be between 5 and 300 characters.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Could not send request.");
      }
      setRequested(true);
      setOpen(false);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {requested ? (
          <span
            className="inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700"
            aria-live="polite"
          >
            Requested
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setMessage(`Hi ${mentorName}, I would love to learn from your experience.`);
              setError(null);
            }}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            Connect
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Mentorship</h3>
                <p className="mt-1 text-sm text-gray-500">Send a short note to {mentorName}.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!sending) {
                    setOpen(false);
                    setError(null);
                  }
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="mentor-connect-msg">
              Message
            </label>
            <textarea
              id="mentor-connect-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 300))}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Write a short message..."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{error ? <span className="text-red-600">{error}</span> : "Keep it short and clear."}</span>
              <span>{message.trim().length}/300</span>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!sending) {
                    setOpen(false);
                    setError(null);
                  }
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={sending}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {sending ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
