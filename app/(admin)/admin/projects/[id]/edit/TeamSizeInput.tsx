"use client";

import { useState } from "react";

export function TeamSizeInput({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue.replace(/\D+/g, ""));

  return (
    <input
      name="teamSize"
      value={value}
      inputMode="numeric"
      pattern="[0-9]*"
      onChange={(e) => setValue(e.target.value.replace(/\D+/g, ""))}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
    />
  );
}

