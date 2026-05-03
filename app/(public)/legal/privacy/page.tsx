import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "InvestMind privacy policy: how we handle your data when you use our platform.",
  path: "/legal/privacy",
});

export default function Privacy() {
  return (
    <div>
      <h1>Privacy Policy</h1>
    </div>
  );
}
