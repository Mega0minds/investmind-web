import { cn } from "@/lib/utils";
import { THEME } from "@/lib/constants";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

/**
 * Shared input widget. Use in auth forms, dashboard forms, etc.
 */
export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: THEME.text }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border px-4 py-3 text-base transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30",
          className
        )}
        style={{
          borderColor: THEME.border,
          color: "#1a1a1a",
        }}
        {...props}
      />
      {error && (
        <p className="text-sm" style={{ color: THEME.accent }}>
          {error}
        </p>
      )}
    </div>
  );
}
