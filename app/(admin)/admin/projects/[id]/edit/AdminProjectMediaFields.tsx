"use client";

import { useMemo, useState } from "react";
import { projectMediaPublicUrl } from "@/lib/project-media-url";

export function AdminProjectMediaFields({
  initialCoverImageFileName,
  initialScreenshotFileNames,
}: {
  initialCoverImageFileName: string;
  initialScreenshotFileNames: string[];
}) {
  const [coverImageFileName, setCoverImageFileName] = useState(initialCoverImageFileName);
  const [screenshotFileNames, setScreenshotFileNames] = useState(initialScreenshotFileNames);
  const [uploading, setUploading] = useState<null | "cover" | "screenshots">(null);
  const [error, setError] = useState<string | null>(null);

  const coverUrl = useMemo(() => projectMediaPublicUrl(coverImageFileName), [coverImageFileName]);

  async function upload(file: File, kind: "cover" | "screenshots"): Promise<string | null> {
    const body = new FormData();
    body.append("kind", kind);
    body.append("file", file);
    const res = await fetch("/api/storage/project-media/upload", { method: "POST", body });
    const payload = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !payload.path) {
      setError(payload.error || "Upload failed. Please try again.");
      return null;
    }
    return payload.path;
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="coverImageFileName" value={coverImageFileName} />
      <input type="hidden" name="screenshotFileNames" value={screenshotFileNames.join(", ")} />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cover image
        </label>
        <div className="rounded-xl border border-gray-200 p-3">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-36 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
              No cover uploaded
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              {uploading === "cover" ? "Uploading..." : "Upload cover"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading !== null}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (!file) return;
                  setError(null);
                  setUploading("cover");
                  try {
                    const path = await upload(file, "cover");
                    if (path) setCoverImageFileName(path);
                  } finally {
                    setUploading(null);
                  }
                }}
              />
            </label>
            {coverImageFileName ? (
              <button
                type="button"
                onClick={() => setCoverImageFileName("")}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Remove cover
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Screenshots
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {screenshotFileNames.map((path) => {
            const src = projectMediaPublicUrl(path);
            return (
              <div key={path} className="rounded-xl border border-gray-200 p-2">
                <div className="h-28 overflow-hidden rounded-md bg-gray-50">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setScreenshotFileNames((prev) => prev.filter((p) => p !== path))}
                  className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>
            );
          })}
          {screenshotFileNames.length < 5 ? (
            <label className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100">
              {uploading === "screenshots" ? "Uploading..." : "+ Add screenshot"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={uploading !== null}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.currentTarget.value = "";
                  if (!files.length) return;
                  const remaining = Math.max(0, 5 - screenshotFileNames.length);
                  const toAdd = files.slice(0, remaining);
                  if (!toAdd.length) return;
                  setError(null);
                  setUploading("screenshots");
                  try {
                    const uploaded = await Promise.all(toAdd.map((file) => upload(file, "screenshots")));
                    const valid = uploaded.filter((x): x is string => Boolean(x));
                    if (valid.length) {
                      setScreenshotFileNames((prev) => [...prev, ...valid]);
                    }
                  } finally {
                    setUploading(null);
                  }
                }}
              />
            </label>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-gray-500">Up to 5 screenshots.</p>
      </div>

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

