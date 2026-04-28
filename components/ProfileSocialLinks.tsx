import { buildProfileSocialLinks, type ProfileSocialRow } from "@/lib/social-links";
import { THEME } from "@/lib/constants";

export function ProfileSocialLinks({
  profile,
  emptyMessage = "No social links added yet.",
}: {
  profile: ProfileSocialRow;
  /** Shown when there are no valid links (matches About / Expertise placeholders). */
  emptyMessage?: string;
}) {
  const links = buildProfileSocialLinks(profile);
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Social</h3>
      {links.length ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Social links">
          {links.map((l) => (
            <li key={l.key}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-purple-200 hover:bg-purple-50"
                style={{ color: THEME.primary }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-gray-700">{emptyMessage}</p>
      )}
    </div>
  );
}
