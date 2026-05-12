/** Fields required before we treat a member profile as “onboarding complete”. */
export type MemberOnboardingProfile = {
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  age?: number | null;
} | null;

export function isMemberProfileOnboardingComplete(
  profile: MemberOnboardingProfile | undefined
): boolean {
  if (!profile) return false;
  return Boolean(
    profile.first_name &&
      profile.last_name &&
      profile.role &&
      profile.age != null
  );
}
