"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { THEME } from "@/lib/constants";

type AdminUserSearchProps = {
  initialQuery: string;
  tab: "all" | "mentors" | "creatives" | "suspended";
};

export function AdminUserSearch({ initialQuery, tab }: AdminUserSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const currentParamsKey = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(currentParamsKey);
      const next = value.trim();

      if (next) {
        params.set("q", next);
      } else {
        params.delete("q");
      }
      // When search changes, always reset pagination.
      params.delete("page");
      // Keep tab stable.
      params.set("tab", tab);

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 220);

    return () => window.clearTimeout(handle);
  }, [value, tab, pathname, router, currentParamsKey]);

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name or email..."
        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-purple-300 sm:w-72"
      />
      <span
        className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white"
        style={{ backgroundColor: THEME.primary }}
      >
        Search
      </span>
    </div>
  );
}
