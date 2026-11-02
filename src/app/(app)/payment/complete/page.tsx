"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { titleCase } from "@/lib/format";
import { Card } from "@/components/ui";

/** Where the API sends website users after a Nomba checkout (?screen=&status=&reference=). */
const DESTINATIONS: Record<string, { href: string; label: string }> = {
  wallet: { href: "/wallet", label: "Go to wallet" },
  fx: { href: "/fx/recipient", label: "Add the receiving account" },
  shipments: { href: "/shipments", label: "View my shipments" },
  shop4me: { href: "/orders", label: "View my orders" },
  orders: { href: "/orders", label: "View my orders" },
  amazon: { href: "/orders", label: "View my orders" },
  "naija-shop": { href: "/orders", label: "View my orders" },
  home: { href: "/dashboard", label: "Back to dashboard" },
};

export default function PaymentCompletePage() {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => setParams(new URLSearchParams(window.location.search)), []);

  if (!params) return null;
  const status = (params.get("status") ?? "").toLowerCase();
  const ok = status === "successful" || status === "success";
  const screen = params.get("screen") ?? "home";
  const dest = DESTINATIONS[screen] ?? DESTINATIONS.home;

  return (
    <Card className="max-w-lg mx-auto p-8 text-center">
      <div className={`mx-auto size-16 rounded-full flex items-center justify-center text-3xl ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
        {ok ? "✓" : "!"}
      </div>
      <h1 className="text-2xl font-black text-navy mt-5">{ok ? "Payment successful" : "Payment not completed"}</h1>
      <p className="text-navy/70 mt-2">
        {ok
          ? `Your ${titleCase(params.get("paymentType") ?? "payment").toLowerCase()} has been confirmed.`
          : "We couldn't confirm this payment. If you were charged, it will be confirmed shortly — check your transactions."}
      </p>
      {params.get("reference") && <p className="text-xs text-navy/40 mt-3 break-all">Reference: {params.get("reference")}</p>}
      <div className="flex flex-col gap-3 mt-7">
        <Link href={dest.href} className="font-bold text-white bg-orange rounded-xl px-6 py-3">{dest.label}</Link>
        <Link href="/transactions" className="font-bold text-navy">View transactions</Link>
      </div>
    </Card>
  );
}
