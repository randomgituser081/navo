"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { FX_PENDING_KEY } from "@/lib/fx";

type Pending = { conversionId: string; from: string; to: string; amount: number; converted: number };

/** Step after an FX payment: where should the converted money go? */
export default function FxRecipientPage() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Pending | null | undefined>(undefined);
  const isNaira = pending?.to === "NGN";
  const { data: bankRes } = useApi(isNaira ? "/banks" : null);
  const banks: { name: string; code: string }[] = bankRes?.banks ?? [];

  const [form, setForm] = useState({ bankCode: "", bankName: "", accountNumber: "", accountName: "", sortCode: "" });
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FX_PENDING_KEY);
      setPending(raw ? JSON.parse(raw) : null);
    } catch {
      setPending(null);
    }
  }, []);

  // Nigerian accounts: resolve the account name from bank + number.
  useEffect(() => {
    if (!isNaira || form.accountNumber.length !== 10 || !form.bankCode) return;
    let cancelled = false;
    setLookingUp(true);
    navo
      .post("/banks/account-details", { accountNumber: form.accountNumber, bankCode: form.bankCode })
      .then((res) => !cancelled && setForm((f) => ({ ...f, accountName: res?.accountName ?? "" })))
      .catch((err) => !cancelled && toast((err as Error).message, "danger"))
      .finally(() => !cancelled && setLookingUp(false));
    return () => {
      cancelled = true;
    };
  }, [isNaira, form.accountNumber, form.bankCode, toast]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) return toast("Fill in the bank, account number and account name", "danger");
    if (!isNaira && pending.to === "GBP" && !form.sortCode.trim()) return toast("Enter the sort code", "danger");
    setSaving(true);
    try {
      await navo.post("/fx/save-recipient", {
        conversionId: pending.conversionId,
        recipientBankName: form.bankName.trim(),
        recipientAccountName: form.accountName.trim(),
        recipientAccountNumber: form.accountNumber.trim(),
        ...(form.sortCode.trim() && { recipientSortCode: form.sortCode.trim() }),
      });
      try {
        localStorage.removeItem(FX_PENDING_KEY);
      } catch {}
      toast("Receiving account saved. We'll send your money shortly.", "success");
      router.replace("/transactions");
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setSaving(false);
    }
  }

  if (pending === undefined) return null;
  if (!pending) return <EmptyState title="No exchange waiting for an account" text="Start an exchange first." action={<Link href="/fx" className="font-bold text-orange">Go to FX</Link>} />;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Where should we send it?</h1>
      <Card className="p-5 bg-page">
        <p className="text-sm text-navy/60">You&apos;re receiving</p>
        <p className="text-2xl font-black text-navy">{money(pending.converted, pending.to)}</p>
        <p className="text-xs text-navy/50">for {money(pending.amount, pending.from)}</p>
      </Card>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          {isNaira ? (
            <Field label="Bank">
              <Select
                value={form.bankCode}
                onChange={(e) => {
                  const bank = banks.find((b) => b.code === e.target.value);
                  setForm({ ...form, bankCode: e.target.value, bankName: bank?.name ?? "", accountName: "" });
                }}
              >
                <option value="">{banks.length ? "Select bank" : "Loading banks…"}</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </Select>
            </Field>
          ) : (
            <Field label="Bank name"><Input value={form.bankName} onChange={set("bankName")} /></Field>
          )}
          <Field label="Account number">
            <Input inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\s/g, ""), ...(isNaira && { accountName: "" }) })} maxLength={isNaira ? 10 : 34} />
          </Field>
          {!isNaira && pending.to === "GBP" && <Field label="Sort code"><Input value={form.sortCode} onChange={set("sortCode")} placeholder="00-00-00" /></Field>}
          <Field label="Account name" hint={isNaira ? (lookingUp ? "Looking up account…" : "Filled in automatically from the bank.") : undefined}>
            <Input value={form.accountName} onChange={set("accountName")} readOnly={isNaira} />
          </Field>
          <Button type="submit" loading={saving} className="w-full">Save receiving account</Button>
        </form>
      </Card>
    </div>
  );
}
