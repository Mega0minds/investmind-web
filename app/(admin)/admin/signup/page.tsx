import { AuthLayout } from "@/app/(auth)/_components/AuthLayout";
import { AuthHero } from "@/app/(auth)/_components/AuthHero";
import { AdminSignupForm } from "@/app/(auth)/_components/AdminSignupForm";

export default function AdminSignupPage() {
  return (
    <AuthLayout formOnRight hero={<AuthHero image="/assets/signup.png" />}>
      <AdminSignupForm />
    </AuthLayout>
  );
}
