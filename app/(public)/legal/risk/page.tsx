import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Risk Disclosure",
  description: "Important risk information for innovators, investors, and community members using InvestMind.",
  path: "/legal/risk",
});

export default function Risk() {
  return (
    <div>
      <h1>Risk Disclosure</h1>
    </div>
  );
}
