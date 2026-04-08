"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onDeleteConfirmed() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setErrorMessage(msg || "Failed to delete project.");
        return;
      }
      setShowConfirmModal(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center disabled:opacity-60"
        aria-label="Delete project"
        title="Delete project"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z" />
        </svg>
      </button>
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Delete project?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onDeleteConfirmed()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Could not delete project</h3>
            <p className="mt-2 text-sm text-gray-600 wrap-break-word">{errorMessage}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#5A2D8F" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

