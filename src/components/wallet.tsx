"use client";

import { useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { dateTime, money, titleCase } from "@/lib/format";
import { Badge, Button, Field, Input, Modal, Select, statusTone } from "./ui";
import { useToast } from "./toast";

/**
 * Starts a Nomba checkout and sends the browser to it. Nomba returns to the API callback,
 * which (for the website) redirects to /payment/complete.
 */
export function FundWalletModal({ open, onClose, defaultCurrency = "NGN" }: { open: boolean; onClose: () => void; defaultCurrency?: string }) {
  const toast = useToast();
  const [currency, setCurrency] = useState(defaultCurrency.toUpperCase() === "GBP" ? "GBP" : "NGN");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return toast("Enter an amount", "danger");
    setLoading(true);
    try {
      const res = await navo.post(`/wallet/${currency.toLowerCase()}`, { amount: value });
      const link = res?.tnx?.checkoutLink;
      if (!link) throw new Error("Could not start the payment. Please try again.");
      window.location.href = link;
    } catch (err) {
      toast((err as Error).message, "danger");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Fund wallet">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Wallet">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="NGN">Naira wallet (NGN)</option>
            <option value="GBP">Pound wallet (GBP)</option>
          </Select>
        </Field>
        <Field label="Amount" hint="You'll pay securely on Nomba, then come back here.">
          <Input type="number" min="1" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Button type="submit" loading={loading} className="w-full">Continue to payment</Button>
      </form>
    </Modal>
  );
}

export type Transaction = {
  id: string;
  amount: number | string;
  currency: string;
  category?: string;
  transactionType?: string;
  transactionsLabel?: string;
  paymentType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionReference?: string;
  createdAt?: string;
};

export function TransactionRow({ tx }: { tx: Transaction }) {
  const credit = /credit|deposit|top.?up|fund/i.test(`${tx.transactionType} ${tx.category} ${tx.paymentType}`);
  const label = tx.transactionsLabel || titleCase(tx.paymentType || tx.category || tx.transactionType) || "Transaction";
  return (
    <div className="flex items-center gap-4 py-4">
      <div className={`size-11 shrink-0 rounded-full flex items-center justify-center font-bold ${credit ? "bg-emerald-50 text-emerald-600" : "bg-orange-100 text-orange"}`}>
        {credit ? "↓" : "↑"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy truncate">{label}</p>
        <p className="text-xs text-navy/50">{dateTime(tx.createdAt)}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-navy">{credit ? "+" : "−"}{money(tx.amount, tx.currency)}</p>
        {tx.paymentStatus && <Badge tone={statusTone(tx.paymentStatus)}>{titleCase(tx.paymentStatus)}</Badge>}
      </div>
    </div>
  );
}
