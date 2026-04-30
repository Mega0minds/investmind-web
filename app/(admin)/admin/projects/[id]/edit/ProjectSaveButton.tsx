"use client";

import { useEffect, useMemo, useState } from "react";

function serializeForm(form: HTMLFormElement): string {
  const pairs: string[] = [];
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    pairs.push(`${key}:${String(value)}`);
  }
  return pairs.join("\n");
}

export function ProjectSaveButton({ formId }: { formId: string }) {
  const [isDirty, setIsDirty] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const firstSnapshot = serializeForm(form);
    setInitialSnapshot(firstSnapshot);
    setIsDirty(false);

    const timer = window.setInterval(() => {
      const next = serializeForm(form);
      setIsDirty(next !== firstSnapshot);
    }, 250);

    return () => window.clearInterval(timer);
  }, [formId]);

  const disabled = useMemo(() => !initialSnapshot || !isDirty, [initialSnapshot, isDirty]);

  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      style={disabled ? { backgroundColor: "#9CA3AF" } : { backgroundColor: "#5A2D8F" }}
    >
      Save changes
    </button>
  );
}

