import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "InvestMind terms of service for using the platform, accounts, and community features.",
  path: "/legal/terms",
});

export default function Terms() {
  return (
    <div>
      <h1>Terms of Service</h1>
    </div>
  );
}
