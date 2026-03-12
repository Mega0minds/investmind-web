import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { ForgotPasswordForm } from "../_components/ForgotPasswordForm";

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
