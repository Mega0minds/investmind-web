import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { ForgotPasswordForm } from "../_components/ForgotPasswordForm";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Forgot password",
  description: "Reset your InvestMind password securely using the email on your account.",
  path: "/forgot-password",
});

/**
 * Forgot password: enter email to receive a reset link.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout formOnRight hero={<AuthHero image="/assets/signup.png" />}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
