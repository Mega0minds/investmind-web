import type { MetadataRoute } from "next";
import { getSiteUrlForMetadata } from "@/lib/site-url";

/** Public routes only; omit authenticated app shells. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrlForMetadata();
  if (!base) return [];

  const now = new Date();
  const paths = [
    "",
    "/login",
    "/signup",
    "/forgot-password",
    "/legal/privacy",
    "/legal/terms",
    "/legal/risk",
  ];

  return paths.map((path) => ({
    url: new URL(path, base).href,
    lastModified: now,
    changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "" ? 1 : 0.5,
  }));
}
