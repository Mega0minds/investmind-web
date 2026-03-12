import { AuthLayout } from "../../_components/AuthLayout";
import { AuthHero } from "../../_components/AuthHero";
import { CompleteProfileForm } from "../../_components/CompleteProfileForm";

/**
 * Second step of signup: collect first name, last name, role, age.
 * User must be signed in (redirects to login otherwise).
 */
export default function CompleteProfilePage() {
  return (
    <AuthLayout hero={<AuthHero image="/assets/signup.png" />}>
      <CompleteProfileForm />
    </AuthLayout>
  );
}
