import { SEO_DEFAULT_DESCRIPTION, SEO_SITE_NAME } from "@/lib/seo-metadata";

type HomeJsonLdProps = {
  /** Origin only, e.g. `https://investmind.com` — omit script when unset (local without env). */
  siteOrigin: string | undefined;
};

/**
 * Organization + WebSite structured data for the homepage (helps rich results / knowledge graph).
 */
export function HomeJsonLd({ siteOrigin }: HomeJsonLdProps) {
  if (!siteOrigin) return null;

  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteOrigin}/#organization`,
      name: SEO_SITE_NAME,
      url: siteOrigin,
      description: SEO_DEFAULT_DESCRIPTION,
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/assets/ilogo.png`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteOrigin}/#website`,
      name: SEO_SITE_NAME,
      url: siteOrigin,
      description: SEO_DEFAULT_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${siteOrigin}/#organization` },
    },
  ];

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
