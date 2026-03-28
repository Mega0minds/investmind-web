"use client";

import { useState } from "react";
import { AuthLayout } from "../../_components/AuthLayout";
import { AuthHero } from "../../_components/AuthHero";
import { CompleteProfileForm } from "../../_components/CompleteProfileForm";

export function CompleteProfilePageClient() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <AuthLayout
      panelKey={step}
      formOnRight={step === 2}
      hero={<AuthHero image="/assets/signup.png" />}
    >
      <CompleteProfileForm step={step} onStepChangeAction={setStep} />
    </AuthLayout>
  );
}
