"use client";

import { useEffect, useRef, useState } from "react";
import { onLoaderChange } from "@/lib/api";

/**
 * The mobile app's loader: its loading.json Lottie in a small white card
 * (navo_app_frontend/components/FullScreenLoader.tsx).
 */
export function NavoLoader({ size = 60 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: { destroy: () => void } | undefined;
    let cancelled = false;
    // Light SVG player: smaller, and enough for this animation.
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: true, path: "/loading.json" });
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg w-24 h-20 flex items-center justify-center shadow-[0_3px_6px_rgba(0,0,0,0.16)]" role="status" aria-label="Loading">
      <div ref={ref} style={{ width: size, height: size }} />
    </div>
  );
}

/** App-wide loader shown while any write request (save, pay, submit) is in flight. */
export function LoaderHost() {
  const [busy, setBusy] = useState(false);
  useEffect(() => onLoaderChange(setBusy), []);
  return <FullScreenLoader visible={busy} />;
}

/** Blocks the page while something important runs (payments, redirects). */
export function FullScreenLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
      <NavoLoader />
    </div>
  );
}
