/** Public URL for an object stored in the `project-media` bucket. */
export function projectMediaPublicUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${baseUrl}/storage/v1/object/public/project-media/${encodedPath}`;
}
