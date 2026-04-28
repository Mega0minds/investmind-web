import type { MetadataRoute } from "next";
import { getSiteUrlForMetadata } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrlForMetadata();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: base ? new URL("/sitemap.xml", base).href : undefined,
  };
}
