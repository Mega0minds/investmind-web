"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

export function AdminUserActionButtons({
  userId,
  userName,
  active,
  editHref,
  action,
}: {
  userId: string;
  userName: string;
  active: boolean;
  editHref: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitToggle(nextVisible: boolean) {
    const form = formRef.current;
    if (!form || isPending) return;

    const field = form.elements.namedItem("makeVisible");
    if (!(field instanceof HTMLInputElement)) return;
    field.value = nextVisible ? "1" : "0";

    startTransition(() => {
      form.requestSubmit();
    });
  }

  return (
    <>
      <div className="inline-flex items-center justify-end gap-2">
        <Link
          href={editHref}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
          title="View/Edit user profile"
          aria-label={`Edit ${userName}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 2.12l-8.4 8.4-3.22.86.86-3.22 8.64-8.16Z" />
            <path d="M3.5 16a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2h-12a1 1 0 0 1-1-1Z" />
          </svg>
        </Link>

        <form ref={formRef} action={action}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="makeVisible" value={active ? "0" : "1"} />
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (active) {
                setConfirmOpen(true);
                return;
              }
              submitToggle(true);
            }}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
              active
                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title={active ? "Suspend user" : "Activate user"}
            aria-label={active ? `Suspend ${userName}` : `Activate ${userName}`}
          >
            {active ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm3.71-10.29a1 1 0 0 0-1.42-1.42L10 8.59 7.71 6.3a1 1 0 0 0-1.42 1.4L8.59 10l-2.3 2.29a1 1 0 1 0 1.42 1.42L10 11.41l2.29 2.3a1 1 0 0 0 1.42-1.42L11.41 10l2.3-2.29Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm3.71-9.29a1 1 0 0 0-1.42-1.42L9 10.59 7.71 9.3a1 1 0 0 0-1.42 1.4l2 2a1 1 0 0 0 1.42 0l4-4Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </form>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Suspend user?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to suspend <span className="font-semibold text-gray-900">{userName}</span>?
              They will no longer be visible until re-activated.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  submitToggle(false);
                }}
                disabled={isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Suspending..." : "Yes, suspend"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

