/**
 * Uploaded pictures are stored as paths like "/uploads/profile-pictures/x.jpg" and served
 * by the API, not by this site, so they need the API's address in front.
 */
const MEDIA_ORIGIN = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://navoapi.viaspark.site";

export function mediaUrl(path?: string | null): string | undefined {
  if (!path || typeof path !== "string") return undefined;
  const value = path.trim();
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${MEDIA_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}
