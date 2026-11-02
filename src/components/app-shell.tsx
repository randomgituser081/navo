"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Logo } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/shipments", label: "Shipments", icon: "▣" },
  { href: "/shop", label: "Shop4Me", icon: "◈" },
  { href: "/orders", label: "My orders", icon: "☰" },
  { href: "/fx", label: "FX", icon: "⇄" },
  { href: "/bills", label: "Bills", icon: "ϟ" },
  { href: "/wallet", label: "Wallet", icon: "◎" },
  { href: "/transactions", label: "Transactions", icon: "⇅" },
  { href: "/notifications", label: "Notifications", icon: "◔" },
  { href: "/security", label: "Security", icon: "⚿" },
  { href: "/kyc", label: "Verify identity", icon: "✓" },
  { href: "/profile", label: "Profile", icon: "☺" },
];
// Phones get five tabs; the rest are reachable from the dashboard and profile.
const MOBILE_NAV = ["/dashboard", "/shipments", "/shop", "/wallet", "/profile"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useApi("/profile");
  const { data: unread } = useApi("/notifications/unread");
  const name: string = profile?.user?.accountName ?? "";
  const unreadCount = Number(unread?.notifications ?? 0);

  async function logout() {
    await auth("logout").catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-navy/5 px-4 py-6 sticky top-0 h-screen">
        <Link href="/dashboard" className="px-3 mb-8"><Logo /></Link>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
                isActive(item.href) ? "bg-orange text-white" : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
              {item.href === "/notifications" && unreadCount > 0 && (
                <span className={`ml-auto text-xs font-bold rounded-full px-2 ${isActive(item.href) ? "bg-white text-orange" : "bg-orange text-white"}`}>{unreadCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-navy/5 pt-4 px-3">
          <p className="text-sm font-bold text-navy truncate">{name || " "}</p>
          <button onClick={logout} className="text-sm text-navy/60 hover:text-orange mt-1">Log out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white">
          <Logo />
          <Link href="/notifications" className="relative size-10 rounded-full bg-page flex items-center justify-center text-navy" aria-label="Notifications">
            ◔
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </Link>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 lg:py-10">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-navy/5 grid grid-cols-5 z-40">
        {NAV.filter((item) => MOBILE_NAV.includes(item.href)).map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive(item.href) ? "text-orange" : "text-navy/50"}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
