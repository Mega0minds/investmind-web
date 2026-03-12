import { cn } from "@/lib/utils";
import { THEME } from "@/lib/constants";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared button widget. Use across auth, dashboard, public pages.
 */
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl py-3 px-4 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const variants = {
    primary: "text-white focus:ring-[#5A2D8F]/30",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
    ghost: "text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
  };

  return (
    <button
      type="button"
      className={cn(base, variants[variant], className)}
      style={variant === "primary" ? { backgroundColor: THEME.primary } : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
