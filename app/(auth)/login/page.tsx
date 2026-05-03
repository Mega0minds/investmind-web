import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { LoginForm } from "../_components/LoginForm";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Sign in",
  description:
    "Sign in to InvestMind to manage your profile, projects, investor connections, and community activity.",
  path: "/login",
});

/**
 * Login route. UI lives in (auth)/_components so this file stays thin.
 */
export default function LoginPage() {
  return (
    <AuthLayout formOnRight hero={<AuthHero image="/assets/signup.png" />}>
      <LoginForm />
    </AuthLayout>
  );
}
