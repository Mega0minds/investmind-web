import { Suspense } from "react";
import { AuthLayout } from "@/app/(auth)/_components/AuthLayout";
import { AuthHero } from "@/app/(auth)/_components/AuthHero";
import { LoginForm } from "@/app/(auth)/_components/LoginForm";

export default function AdminLoginPage() {
  return (
    <AuthLayout formOnRight hero={<AuthHero image="/assets/signup.png" />}>
      <Suspense fallback={null}>
        <LoginForm adminOnly />
      </Suspense>
    </AuthLayout>
  );
}
