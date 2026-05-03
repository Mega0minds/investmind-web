import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { SignupForm } from "../_components/SignupForm";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Create account",
  description:
    "Join InvestMind as a creative or investor—create your account to share ideas, connect with community, and grow your profile.",
  path: "/signup",
});

/**
 * Signup route. UI lives in (auth)/_components so this file stays thin.
 */
export default function SignupPage() {
  return (
    <AuthLayout hero={<AuthHero image="/assets/signup.png" />}>
      <SignupForm />
    </AuthLayout>
  );
}
