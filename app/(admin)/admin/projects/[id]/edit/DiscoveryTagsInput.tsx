"use client";

import { useMemo, useState } from "react";

export function DiscoveryTagsInput({ initialTags }: { initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  const serialized = useMemo(() => tags.join(", "), [tags]);

  function addTag() {
    const value = draft.trim();
    if (!value) return;
    setTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value].slice(0, 10);
    });
    setDraft("");
  }

  return (
    <div>
      <input type="hidden" name="discoveryTags" value={serialized} />
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
              title="Remove tag"
            >
              <span>{tag}</span>
              <span aria-hidden>×</span>
            </button>
          ))
        ) : (
          <span className="text-xs text-gray-500">No tags yet.</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tag (e.g. SaaS, Fintech)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

