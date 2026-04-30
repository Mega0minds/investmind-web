"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

export function ProjectRowActions({
  projectId,
  projectName,
  editHref,
  deleteAction,
}: {
  projectId: string;
  projectName: string;
  editHref: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submitDelete() {
    if (!formRef.current || isPending) return;
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <>
      <div className="inline-flex items-center justify-end gap-2">
        <Link
          href={editHref}
          className="inline-flex rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200"
        >
          Edit project
        </Link>
        <form ref={formRef} action={deleteAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Delete project"
            aria-label={`Delete ${projectName}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path
                fillRule="evenodd"
                d="M8.5 2a1 1 0 0 0-.8.4L7.2 3H5a1 1 0 1 0 0 2h.2l.7 9.1A2 2 0 0 0 7.9 16h4.2a2 2 0 0 0 1.99-1.9L14.8 5H15a1 1 0 1 0 0-2h-2.2l-.5-.6a1 1 0 0 0-.8-.4h-3Zm1 5a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V7Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete project?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-900">{projectName}</span>. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  submitDelete();
                }}
                disabled={isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

