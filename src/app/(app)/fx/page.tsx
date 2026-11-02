"use client";

import { useMemo, useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, Field, Input, PageLoader, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

const CURRENCIES = [
  { code: "NGN", flag: "🇳🇬" },
  { code: "GBP", flag: "🇬🇧" },
  { code: "USD", flag: "🇺🇸" },
  { code: "EUR", flag: "🇪🇺" },
];

type ChartPair = { pair: string; data: { value: number; label: string }[] };
import { FX_PENDING_KEY } from "@/lib/fx";

export default function FxPage() {
  const toast = useToast();
  const { data, loading } = useApi<ChartPair[]>("/fx/chart");
  const [from, setFrom] = useState("NGN");
  const [to, setTo] = useState("GBP");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const pairs = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const pair = pairs.find((p) => p.pair === `${from}/${to}`);
  const rate = pair?.data?.[pair.data.length - 1]?.value ?? 0;
  const converted = rate * Number(amount || 0);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (from === to) return toast("Choose two different currencies", "danger");
    if (!rate) return toast("No rate is set for this pair yet", "danger");
    const value = Number(amount);
    if (!value || value < 10) return toast("Enter at least 10", "danger");
    setBusy(true);
    try {
      const res = await navo.post("/fx/exchange", { from, to, amount: value });
      const conversionId = res?.conversionId ?? res?.data?.conversionId;
      const link = res?.checkoutLink ?? res?.data?.checkoutLink;
      if (!conversionId || !link) throw new Error("Could not start the exchange. Please try again.");
      // After payment you add the account that receives the money (/fx/recipient).
      try {
        localStorage.setItem(FX_PENDING_KEY, JSON.stringify({ conversionId, from, to, amount: value, converted, at: Date.now() }));
      } catch {}
      window.location.href = link;
    } catch (err) {
      toast((err as Error).message, "danger");
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">FX exchange</h1>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <Field label="You pay">
                <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </Select>
              </Field>
              <button type="button" onClick={swap} className="mb-1 size-10 rounded-full bg-orange text-white text-lg" aria-label="Swap currencies">⇄</button>
              <Field label="You get">
                <Select value={to} onChange={(e) => setTo(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </Select>
              </Field>
            </div>
            <Field label={`Amount in ${from}`}>
              <Input type="number" min="10" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </Field>
            <div className="rounded-xl bg-page p-4">
              <p className="text-sm text-navy/60">You will get</p>
              <p className="text-3xl font-black text-navy">{money(converted, to)}</p>
              <p className="text-xs text-navy/50 mt-1">{rate ? `1 ${from} = ${rate} ${to}` : "No rate set for this pair yet"}</p>
            </div>
            <Button type="submit" loading={busy} disabled={!rate} className="w-full">Continue to payment</Button>
            <p className="text-xs text-navy/50">Exchanges require a KYC-verified account. After paying, you&apos;ll add the account that receives the money.</p>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-black text-navy mb-3">Today&apos;s rates</h2>
        {pairs.length ? (
          <ul className="divide-y divide-navy/5">
            {pairs.map((p) => {
              const latest = p.data?.[p.data.length - 1];
              return (
                <li key={p.pair} className="flex justify-between py-3 text-sm">
                  <span className="font-bold text-navy">{p.pair.replace("/", " → ")}</span>
                  <span className="text-navy/70">{latest?.value ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-navy/60">No rates are set yet.</p>
        )}
      </Card>
    </div>
  );
}
