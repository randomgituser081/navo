"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, PageLoader } from "@/components/ui";
import { FundWalletModal } from "@/components/wallet";

export default function WalletPage() {
  const { data, loading } = useApi("/wallet");
  const [fund, setFund] = useState<string | null>(null);
  const wallet = data?.wallet;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Wallet</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { cur: "NGN", flag: "🇳🇬", label: "Naira", value: wallet?.walletBalanceNGN },
          { cur: "GBP", flag: "🇬🇧", label: "Pound", value: wallet?.walletBalanceGBP },
        ].map((w) => (
          <Card key={w.cur} className="p-6">
            <p className="text-sm font-medium text-navy/60">{w.label} wallet</p>
            <p className="text-3xl font-black text-navy mt-2">{money(w.value, w.cur)}</p>
            <Button onClick={() => setFund(w.cur)} className="mt-5 w-full">Fund {w.cur} wallet</Button>
          </Card>
        ))}
      </div>
      <p className="text-sm text-navy/60">Payments are processed securely by Nomba. Your balance updates as soon as the payment is confirmed.</p>
      <FundWalletModal key={fund ?? "closed"} open={!!fund} onClose={() => setFund(null)} defaultCurrency={fund ?? "NGN"} />
    </div>
  );
}
