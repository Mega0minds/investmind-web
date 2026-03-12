import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { ResetPasswordForm } from "../_components/ResetPasswordForm";

/**
 * Set new password after clicking the link in the reset email.
 * Token is in the URL hash; Supabase client will complete the recovery when the page loads.
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout formOnRight hero={<AuthHero image="/assets/signup.png" />}>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
