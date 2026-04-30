import Link from "next/link";
import Image from "next/image";
import { THEME } from "@/lib/constants";

interface LogoProps {
  className?: string;
  /** Show rocket icon (e.g. for dashboard) */
  showRocket?: boolean;
  /** Use for dashboard: slightly larger, consistent spacing */
  variant?: "default" | "dashboard";
}

const RocketIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden
  >
    {/* Rocket body (nose + fuselage) */}
    <path d="M12 2L14 7v9l-2 3-2-3V7L12 2z" fill="#2563EB" />
    {/* Left fin */}
    <path d="M10 14l-2.5 7h2L11 16l-1-2z" fill="#1D4ED8" />
    {/* Right fin */}
    <path d="M14 14l2.5 7h-2L13 16l1-2z" fill="#1D4ED8" />
    {/* Flame */}
    <path d="M11 21L12 24l1-3H11z" fill="#F59E0B" />
  </svg>
);

/**
 * Shared logo widget used in nav, auth pages, footer, etc.
 */
export function Logo({ className = "", showRocket = false, variant = "default" }: LogoProps) {
  const isDashboard = variant === "dashboard";
  const logoWidth = isDashboard ? 120 : 140;
  const logoHeight = isDashboard ? 34 : 40;
  return (
    <Link
      href={isDashboard ? "/dashboard" : "/"}
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ color: THEME.text }}
      aria-label="InvestMind home"
    >
      {showRocket && <RocketIcon size={isDashboard ? 26 : 24} />}
      <Image
        src="/assets/ilogo.png"
        alt="InvestMind"
        width={logoWidth}
        height={logoHeight}
        priority={isDashboard}
        className="h-auto w-auto max-h-10"
      />
    </Link>
  );
}
