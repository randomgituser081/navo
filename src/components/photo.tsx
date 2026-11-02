/**
 * The brand photos (from the app's onboarding) are tall portraits with a blue fade baked
 * into the bottom. Cropped into wide cards they need a per-photo focus point, or the
 * card shows sky / the fade instead of the subject.
 */
const PHOTOS = {
  courier: { src: "/background1.jpg", focus: "50% 22%", alt: "Navo courier holding a parcel" },
  phone: { src: "/background2.jpg", focus: "50% 38%", alt: "Woman tracking a delivery on her phone" },
  relax: { src: "/background3.jpg", focus: "50% 34%", alt: "Man relaxing while Navo shops for him" },
  payments: { src: "/background4.jpg", focus: "60% 52%", alt: "Secure payment on a phone" },
} as const;

export type PhotoName = keyof typeof PHOTOS;

export function Photo({ name, className = "", decorative = true }: { name: PhotoName; className?: string; decorative?: boolean }) {
  const p = PHOTOS[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.src} alt={decorative ? "" : p.alt} className={`object-cover ${className}`} style={{ objectPosition: p.focus }} loading="lazy" />
  );
}
