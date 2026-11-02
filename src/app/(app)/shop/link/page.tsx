"use client";

import { useState } from "react";
import { navo } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { AddressFields, EMPTY_ADDRESS, addressProblem, type Address } from "@/components/shop";
import { useToast } from "@/components/toast";

type Item = { item: string; onlineStoreLink: string; goodSize: string; color: string; quantity: string; amount: string; currency: string; details: string };
const EMPTY_ITEM: Item = { item: "", onlineStoreLink: "", goodSize: "", color: "", quantity: "1", amount: "", currency: "GBP", details: "" };

/** Shop with link: paste any online store link, Navo buys it. Draft → summary → pay. */
export default function ShopWithLinkPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [draft, setDraft] = useState<{ id: string; total?: number; currency?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (i: number, k: keyof Item) => (e: { target: { value: string } }) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: e.target.value } : it)));

  async function createDraft() {
    for (const [i, it] of items.entries()) {
      if (!it.item.trim() || !it.onlineStoreLink.trim()) return toast(`Item ${i + 1}: add the name and the store link`, "danger");
      if (!Number(it.amount) || !Number(it.quantity)) return toast(`Item ${i + 1}: add the price and quantity`, "danger");
    }
    const problem = addressProblem(address);
    if (problem) return toast(problem, "danger");
    setBusy(true);
    try {
      const res = await navo.post("/shop/checkout", {
        items: items.map((it) => ({
          item: it.item.trim(),
          onlineStoreLink: it.onlineStoreLink.trim(),
          goodSize: it.goodSize.trim() || "N/A",
          color: it.color.trim() || "N/A",
          quantity: Number(it.quantity),
          amount: Number(it.amount),
          currency: it.currency,
          details: it.details.trim() || undefined,
        })),
        shippingAddress: address,
      });
      const shop = res?.shop ?? res?.data?.shop ?? res?.data;
      if (!shop?.id) throw new Error("Could not create the order. Please try again.");
      setDraft({ id: shop.id, total: Number(shop.totalAmount ?? shop.totalAmountNGN ?? 0) || undefined, currency: shop.currency ?? "NGN" });
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await navo.post("/shop/confirm-and-pay", { draftOrderId: draft.id, paymentMethod: "nomba" });
      const link = res?.checkoutLink ?? res?.data?.checkoutLink;
      if (!link) throw new Error("Could not start the payment. Please try again.");
      window.location.href = link;
    } catch (err) {
      toast((err as Error).message, "danger");
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">Shop with a link</h1>
          <p className="text-navy/60">Paste a link from any online store. We buy it, add a service fee and ship it to you.</p>
        </div>
        {items.map((it, i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-navy">Item {i + 1}</h2>
              {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-sm text-red-600 font-bold">Remove</button>}
            </div>
            <Field label="Product link"><Input type="url" value={it.onlineStoreLink} onChange={update(i, "onlineStoreLink")} placeholder="https://" /></Field>
            <Field label="Item name"><Input value={it.item} onChange={update(i, "item")} /></Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Size"><Input value={it.goodSize} onChange={update(i, "goodSize")} /></Field>
              <Field label="Colour"><Input value={it.color} onChange={update(i, "color")} /></Field>
              <Field label="Quantity"><Input type="number" min="1" value={it.quantity} onChange={update(i, "quantity")} /></Field>
              <Field label="Currency">
                <Select value={it.currency} onChange={update(i, "currency")}>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="NGN">NGN</option>
                </Select>
              </Field>
            </div>
            <Field label="Price per item"><Input type="number" min="0" step="0.01" value={it.amount} onChange={update(i, "amount")} /></Field>
            <Field label="Notes (optional)"><Input value={it.details} onChange={update(i, "details")} /></Field>
          </Card>
        ))}
        <Button variant="outline" onClick={() => setItems([...items, { ...EMPTY_ITEM }])}>+ Add another item</Button>
      </div>

      <Card className="p-6 lg:sticky lg:top-10 space-y-4">
        <h2 className="font-black text-navy">Delivery</h2>
        {draft ? (
          <>
            <p className="text-sm text-navy/70">Your order is ready. The total includes the item prices, exchange and Navo&apos;s service fee.</p>
            {draft.total ? <p className="text-3xl font-black text-orange">{money(draft.total, draft.currency)}</p> : null}
            <Button onClick={pay} loading={busy} className="w-full">Pay now</Button>
            <Button variant="ghost" onClick={() => setDraft(null)} className="w-full">Edit order</Button>
          </>
        ) : (
          <>
            <AddressFields value={address} onChange={setAddress} />
            <Button onClick={createDraft} loading={busy} className="w-full">Get total</Button>
          </>
        )}
      </Card>
    </div>
  );
}
