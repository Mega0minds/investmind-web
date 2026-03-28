"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { THEME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type TypeaheadOption = { value: string; label: string };

type TypeaheadFieldProps = {
  label: string;
  options: TypeaheadOption[];
  value: string;
  onChange: (value: string) => void;
  /** Fired when a row is chosen from the list (includes `value` / `label`). */
  onPickOption?: (option: TypeaheadOption) => void;
  /** Fired after the field closes from blur (resolve typed text against your dataset). */
  onQueryBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** When false, user can still type any value (no option list). */
  allowFreeText?: boolean;
  maxVisible?: number;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Text input with a filtered suggestion list (type to narrow options).
 */
export function TypeaheadField({
  label,
  options,
  value,
  onChange,
  onPickOption,
  onQueryBlur,
  placeholder,
  disabled,
  id: idProp,
  className,
  allowFreeText = true,
  maxVisible = 12,
}: TypeaheadFieldProps) {
  const reactId = useId();
  const inputId = idProp ?? `typeahead-${reactId}`;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) {
      return options.slice(0, maxVisible);
    }
    return options
      .filter((o) => normalize(o.label).includes(q) || normalize(o.value).includes(q))
      .slice(0, maxVisible);
  }, [options, value, maxVisible]);

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  }, []);

  useEffect(() => () => clearBlurTimeout(), [clearBlurTimeout]);

  const pick = useCallback(
    (opt: TypeaheadOption) => {
      // Call onChange first so parent handlers that reset derived ids can run before onPickOption sets them.
      onChange(opt.label);
      onPickOption?.(opt);
      setOpen(false);
      setHighlight(0);
    },
    [onChange, onPickOption]
  );

  return (
    <div className={cn("relative space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium"
        style={{ color: THEME.text }}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          clearBlurTimeout();
          if (options.length > 0 || allowFreeText) setOpen(true);
        }}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => {
            setOpen(false);
            onQueryBlur?.();
          }, 180);
        }}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = filtered[highlight];
            if (opt) pick(opt);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border px-4 py-3 text-base transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 disabled:opacity-60"
        style={{
          borderColor: THEME.border,
          color: "#1a1a1a",
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((opt, idx) => (
            <li key={`${opt.value}-${opt.label}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={idx === highlight}
                className={cn(
                  "flex w-full px-4 py-2.5 text-left text-base transition",
                  idx === highlight ? "bg-[#5A2D8F]/10 text-[#1a1a1a]" : "text-gray-800 hover:bg-gray-50"
                )}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(opt);
                }}
                onMouseEnter={() => setHighlight(idx)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
