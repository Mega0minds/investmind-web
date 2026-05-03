/** Main sectors (aligned with project upload wizard and founder interest chips in Settings). */
export const FOUNDER_INTEREST_SECTOR_OPTIONS = [
  "Health & Biotech",
  "Fintech",
  "Climate",
  "AgriTech",
  "EdTech",
  "AI & Machine Learning",
  "Cybersecurity",
  "SaaS & Enterprise",
  "Consumer & Retail",
  "GovTech & Civic Tech",
  "Mobility & Logistics",
  "Real Estate & PropTech",
  "Media & Entertainment",
  "Manufacturing & Hardware",
  "Social Impact",
  "Energy & Utilities",
  "InsurTech",
] as const;

export type MentorProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  mentor_expertise?: string[] | null;
};

/** Union of saved interests and sectors from the founder's projects. */
export function founderCategoryKeys(
  interestSectors: string[] | null | undefined,
  projects: Array<{ sector?: string | null; subcategory?: string | null }>
): string[] {
  const set = new Set<string>();
  for (const s of interestSectors ?? []) {
    const t = typeof s === "string" ? s.trim() : "";
    if (t) set.add(t);
  }
  for (const p of projects) {
    if (p.sector?.trim()) set.add(p.sector.trim());
    if (p.subcategory?.trim()) set.add(p.subcategory.trim());
  }
  return [...set];
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Count how many founder categories overlap mentor expertise (case-insensitive). */
export function mentorOverlapScore(mentorExpertise: string[] | null | undefined, founderKeys: string[]): number {
  if (!founderKeys.length) return 0;
  const founderSet = new Set(founderKeys.map(norm));
  let n = 0;
  for (const e of mentorExpertise ?? []) {
    const t = typeof e === "string" ? norm(e) : "";
    if (t && founderSet.has(t)) n += 1;
  }
  return n;
}

export function mentorDisplayName(m: MentorProfileRow): string {
  const fn = m.first_name?.trim() ?? "";
  const ln = m.last_name?.trim() ?? "";
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  return m.full_name?.trim() || "Investor";
}

export function mentorExpertiseLabel(m: MentorProfileRow, founderKeys: string[]): string {
  const exp = (m.mentor_expertise ?? []).filter((x) => typeof x === "string" && x.trim());
  if (!exp.length) return "Investor";
  if (!founderKeys.length) return exp.slice(0, 2).join(" · ");
  const founderSet = new Set(founderKeys.map(norm));
  const matched = exp.filter((e) => founderSet.has(norm(e)));
  if (matched.length) return matched.slice(0, 2).join(" · ");
  return exp.slice(0, 2).join(" · ");
}

export function initialsFromMentorName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase() || "?";
  }
  const single = parts[0] ?? "";
  if (single.length >= 2) return single.slice(0, 2).toUpperCase();
  return single ? single.slice(0, 2).toUpperCase() : "?";
}
