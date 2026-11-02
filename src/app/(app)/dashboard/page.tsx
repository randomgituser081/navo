"use client";

import { Photo } from "@/components/photo";
import Link from "next/link";
import { useState } from "react";
import { listOf } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, PageLoader } from "@/components/ui";
import { FundWalletModal, TransactionRow, type Transaction } from "@/components/wallet";

const SERVICES = [
  { title: "Cargo", text: "Ship between Nigeria and the UK", photo: "courier" as const, href: "/shipments/new" },
  { title: "Shop4Me", text: "Amazon, Naija Shop and stores", photo: "relax" as const, href: "/shop" },
  { title: "FX", text: "Swap NGN, GBP, USD and EUR", photo: "phone" as const, href: "/fx" },
  { title: "Bills", text: "Airtime, data, TV, electricity", photo: "payments" as const, href: "/bills" },
];

export default function DashboardPage() {
  const { data: profile } = useApi("/profile");
  const { data: walletRes, loading } = useApi("/wallet");
  const { data: txRes, loading: txLoading } = useApi("/transactions/history?page=1&limit=5");
  const [funding, setFunding] = useState(false);

  const wallet = walletRes?.wallet;
  const firstName = String(profile?.user?.accountName ?? "").split(" ")[0];
  const transactions = listOf<Transaction>(txRes);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy">Hello{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-navy/60">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <section className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <Card className="sm:col-span-2"><PageLoader /></Card>
        ) : (
          [
            { cur: "NGN", label: "Naira wallet", value: wallet?.walletBalanceNGN, tone: "from-navy to-navy-700" },
            { cur: "GBP", label: "Pound wallet", value: wallet?.walletBalanceGBP, tone: "from-orange to-[#ff8a3d]" },
          ].map((w) => (
            <div key={w.cur} className={`rounded-2xl p-6 text-white bg-gradient-to-br ${w.tone}`}>
              <p className="text-white/80 text-sm font-medium">{w.label}</p>
              <p className="text-3xl font-black mt-2">{money(w.value, w.cur)}</p>
              <button onClick={() => setFunding(true)} className="mt-5 rounded-xl bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-bold">+ Fund wallet</button>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="font-black text-navy text-lg mb-3">Services</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <Link key={s.title} href={s.href} className="group bg-white rounded-2xl overflow-hidden">
              <Photo name={s.photo} className="h-36 w-full group-hover:scale-[1.03] transition" />
              <div className="p-4">
                <p className="font-black text-navy">{s.title}</p>
                <p className="text-xs text-navy/60 mt-0.5">{s.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black text-navy text-lg">Recent transactions</h2>
          <Link href="/transactions" className="text-sm font-bold text-orange">See all</Link>
        </div>
        {txLoading ? (
          <PageLoader />
        ) : transactions.length ? (
          <div className="divide-y divide-navy/5">{transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</div>
        ) : (
          <EmptyState title="No transactions yet" text="Fund your wallet to get started." action={<Button onClick={() => setFunding(true)}>Fund wallet</Button>} />
        )}
      </Card>

      <FundWalletModal open={funding} onClose={() => setFunding(false)} defaultCurrency={wallet?.currency} />
    </div>
  );
}
