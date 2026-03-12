import { AuthLayout } from "../_components/AuthLayout";
import { AuthHero } from "../_components/AuthHero";
import { SignupForm } from "../_components/SignupForm";

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
