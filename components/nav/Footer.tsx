import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="py-10 sm:py-12 md:py-14 px-6 sm:px-8 md:px-12"
      style={{ backgroundColor: "#2D1B4E", color: "#E5E7EB" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-semibold italic tracking-tight"
            style={{
              color: "#fff",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            InvestMind
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6">
            <Link
              href="/#about"
              className="text-sm transition hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              About Us
            </Link>
            <Link
              href="/#faq"
              className="text-sm transition hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              FAQ
            </Link>
            <Link
              href="/legal/terms"
              className="text-sm transition hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="text-sm transition hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Privacy
            </Link>
          </nav>
        </div>

        <div
          className="mt-8 pt-6 border-t border-white/10 text-center md:text-left text-sm"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          © {new Date().getFullYear()} InvestMind. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
