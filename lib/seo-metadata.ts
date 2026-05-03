import type { Metadata } from "next";
import { getSiteUrlForMetadata } from "@/lib/site-url";

export const SEO_SITE_NAME = "InvestMind";

/** Primary meta description (≈155 chars for SERPs). */
export const SEO_DEFAULT_DESCRIPTION =
  "InvestMind connects young creatives and inventors in Africa with investors, funding, and community—so ideas get seen, supported, and scaled.";

/** Slightly longer homepage variant for `description` + JSON-LD. */
export const SEO_HOMEPAGE_DESCRIPTION =
  "InvestMind is a platform for African youth innovators: share ideas, explore projects, meet investors, and grow with a supportive community—built for creatives, founders, and capital that cares.";

export const SEO_KEYWORDS = [
  "InvestMind",
  "Africa startups",
  "African innovators",
  "youth entrepreneurship",
  "creative funding",
  "investor network Africa",
  "startup ideas Africa",
  "venture community",
  "idea funding platform",
];

const defaultOgImage = "/assets/home.png";

export function buildRootMetadata(): Metadata {
  const base = getSiteUrlForMetadata();
  const defaultTitle = `${SEO_SITE_NAME} | Discover Africa's Next Big Ideas`;

  return {
    metadataBase: base,
    title: {
      default: defaultTitle,
      template: `%s | ${SEO_SITE_NAME}`,
    },
    description: SEO_DEFAULT_DESCRIPTION,
    applicationName: SEO_SITE_NAME,
    keywords: [...SEO_KEYWORDS],
    authors: [{ name: SEO_SITE_NAME }],
    creator: SEO_SITE_NAME,
    publisher: SEO_SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SEO_SITE_NAME,
      title: defaultTitle,
      description: SEO_DEFAULT_DESCRIPTION,
      url: base?.href ?? "/",
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${SEO_SITE_NAME} — ideas, investors, and community for young innovators in Africa`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: base ? { canonical: "/" } : undefined,
    category: "technology",
  };
}

type PageMetaInput = {
  title: string;
  description: string;
  path: `/${string}` | "";
  /** Optional OG image path on this site (e.g. `/assets/foo.png`) */
  ogImagePath?: string;
};

/**
 * Metadata for a public marketing or content route (canonical + OG + Twitter).
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogImagePath = defaultOgImage,
}: PageMetaInput): Metadata {
  const base = getSiteUrlForMetadata();
  const canonicalPath = path === "" ? "/" : path;
  const canonical = base ? new URL(canonicalPath, base).href : undefined;
  const fullTitle = `${title} | ${SEO_SITE_NAME}`;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SEO_SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: ogImagePath, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImagePath],
    },
  };
}
