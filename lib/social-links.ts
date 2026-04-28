/** Raw profile columns from DB (handles or full URLs). */
export type ProfileSocialRow = {
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  social_website?: string | null;
};

export type BuiltSocialLink = { key: string; href: string; label: string };

function trimRaw(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

/** Normalize user input before save (trim + max length). */
export function clampSocialInput(raw: string, maxLen: number): string {
  return raw.trim().slice(0, maxLen);
}

function safeHttpUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function truncateLabel(s: string, max = 36): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function twitterFromRaw(raw: string): BuiltSocialLink | null {
  const t = trimRaw(raw);
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    const href = safeHttpUrl(t);
    if (!href) return null;
    return { key: "twitter", href, label: "X / Twitter" };
  }
  // Pasted profile path without scheme, e.g. x.com/handle or twitter.com/handle
  let handle = t.replace(/^@+/, "").replace(/\/+$/, "");
  handle = handle.replace(/^(www\.)?(x|twitter)\.com\//i, "");
  if (!handle) return null;
  return {
    key: "twitter",
    href: `https://x.com/${encodeURIComponent(handle)}`,
    label: truncateLabel(`@${handle}`),
  };
}

function linkedinFromRaw(raw: string): BuiltSocialLink | null {
  const t = trimRaw(raw);
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    const href = safeHttpUrl(t);
    if (!href) return null;
    return { key: "linkedin", href, label: "LinkedIn" };
  }
  // www.linkedin.com/... without scheme
  let slug = t.replace(/^@+/, "").replace(/\/+$/, "");
  if (/^(www\.)?linkedin\.com\//i.test(slug)) {
    const href = safeHttpUrl(`https://${slug}`);
    if (href) return { key: "linkedin", href, label: "LinkedIn" };
  }
  slug = slug.replace(/^(www\.)?linkedin\.com\/in\//i, "").replace(/^in\//i, "");
  if (!slug) return null;
  return {
    key: "linkedin",
    href: `https://www.linkedin.com/in/${encodeURIComponent(slug)}/`,
    label: "LinkedIn",
  };
}

function instagramFromRaw(raw: string): BuiltSocialLink | null {
  const t = trimRaw(raw);
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    const href = safeHttpUrl(t);
    if (!href) return null;
    return { key: "instagram", href, label: "Instagram" };
  }
  let rest = t.replace(/^@+/, "").replace(/\/+$/, "");
  if (/^(www\.)?instagram\.com\//i.test(rest)) {
    const href = safeHttpUrl(`https://${rest}`);
    if (href) return { key: "instagram", href, label: "Instagram" };
  }
  const handle = rest.replace(/^instagram\.com\//i, "");
  if (!handle) return null;
  return {
    key: "instagram",
    href: `https://www.instagram.com/${encodeURIComponent(handle)}/`,
    label: truncateLabel(`@${handle}`),
  };
}

function websiteFromRaw(raw: string): BuiltSocialLink | null {
  const t = trimRaw(raw);
  if (!t) return null;
  let href = safeHttpUrl(t);
  if (!href) href = safeHttpUrl(`https://${t}`);
  if (!href) return null;
  const display = t.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return { key: "website", href, label: truncateLabel(display || "Website") };
}

/** Build safe external links for profile display (order: X, LinkedIn, Instagram, website). */
export function buildProfileSocialLinks(row: ProfileSocialRow): BuiltSocialLink[] {
  const links: BuiltSocialLink[] = [];
  const tw = twitterFromRaw(row.social_twitter ?? "");
  if (tw) links.push(tw);
  const li = linkedinFromRaw(row.social_linkedin ?? "");
  if (li) links.push(li);
  const ig = instagramFromRaw(row.social_instagram ?? "");
  if (ig) links.push(ig);
  const web = websiteFromRaw(row.social_website ?? "");
  if (web) links.push(web);
  return links;
}
