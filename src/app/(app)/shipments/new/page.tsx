"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { money } from "@/lib/format";
import { COUNTRIES, GOODS_TYPES, regionsFor } from "@/lib/shipping";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { PinModal } from "@/components/pin";
import { useToast } from "@/components/toast";

type Quote = { totalCost: number; currency: string; pricePerKg: number; documentationFee?: number; subtotal?: number; deliveryDays?: number | string };

export default function NewShipmentPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    locationFrom: "Nigeria", locationTo: "UK",
    pickupLocation: "", pickupAddress: "", dropoffLocation: "", dropoffAddress: "",
    weight: "", goodsType: "general", itemName: "", itemDescription: "",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  // Live price as the route and weight change.
  useEffect(() => {
    const weight = Number(form.weight);
    if (!weight || weight <= 0 || form.locationFrom === form.locationTo) {
      setQuote(null);
      return;
    }
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        setQuote(await navo.post<Quote>("/shipments/calculate-cost", { locationFrom: form.locationFrom, locationTo: form.locationTo, weight }));
      } catch (err) {
        setQuote(null);
        toast((err as Error).message, "danger");
      } finally {
        setQuoting(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.locationFrom, form.locationTo, form.weight, toast]);

  function validate() {
    if (form.locationFrom === form.locationTo) return "Choose different countries for from and to";
    if (!form.pickupLocation || !form.pickupAddress.trim()) return "Add the pick-up location and address";
    if (!form.dropoffLocation || !form.dropoffAddress.trim()) return "Add the drop-off location and address";
    if (!Number(form.weight)) return "Enter the weight in kg";
    if (!form.itemName.trim()) return "Enter the goods name";
    return null;
  }

  const body = (paymentMethod: "nomba" | "wallet") => ({
    ...form,
    weight: Number(form.weight),
    itemName: form.itemName.trim(),
    itemDescription: form.itemDescription.trim() || undefined,
    serviceType: "send",
    paymentMethod,
  });

  async function payByCard(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) return toast(problem, "danger");
    setPaying(true);
    try {
      const res = await navo.post("/shipments/send", body("nomba"));
      const link = res?.checkoutLink ?? res?.data?.checkoutLink;
      if (!link) throw new Error("Could not start the payment. Please try again.");
      window.location.href = link;
    } catch (err) {
      toast((err as Error).message, "danger");
      setPaying(false);
    }
  }

  function payByWallet() {
    const problem = validate();
    if (problem) return toast(problem, "danger");
    setPinOpen(true);
  }

  async function confirmWallet(pin: string) {
    await navo.post("/shipments/send-wallet", { ...body("wallet"), transactionPin: pin });
    setPinOpen(false);
    toast("Shipment lodged and paid from your wallet", "success");
    router.push("/shipments");
  }

  const region = (country: string, value: string, onChange: (e: { target: { value: string } }) => void) => (
    <Select value={value} onChange={onChange}>
      <option value="">Select {country === "Nigeria" ? "state" : "region"}</option>
      {regionsFor(country).map((r) => <option key={r} value={r}>{r}</option>)}
    </Select>
  );

  return (
    <form onSubmit={payByCard} className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">Lodge shipment</h1>
        <Card className="p-6 space-y-4">
          <h2 className="font-black text-navy">Route</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="From">
              <Select value={form.locationFrom} onChange={(e) => setForm({ ...form, locationFrom: e.target.value, pickupLocation: "" })}>
                {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="To">
              <Select value={form.locationTo} onChange={(e) => setForm({ ...form, locationTo: e.target.value, dropoffLocation: "" })}>
                {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Pick-up location">{region(form.locationFrom, form.pickupLocation, set("pickupLocation"))}</Field>
            <Field label="Drop-off location">{region(form.locationTo, form.dropoffLocation, set("dropoffLocation"))}</Field>
            <Field label="Pick-up address"><Input value={form.pickupAddress} onChange={set("pickupAddress")} placeholder="Street, city" /></Field>
            <Field label="Drop-off address"><Input value={form.dropoffAddress} onChange={set("dropoffAddress")} placeholder="Street, city, postcode" /></Field>
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <h2 className="font-black text-navy">Package</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Weight (kg)"><Input type="number" min="0.1" step="0.1" inputMode="decimal" value={form.weight} onChange={set("weight")} /></Field>
            <Field label="Goods type">
              <Select value={form.goodsType} onChange={set("goodsType")}>
                {GOODS_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Goods name"><Input value={form.itemName} onChange={set("itemName")} placeholder="e.g. Clothes and shoes" /></Field>
          <Field label="Details (optional)">
            <textarea value={form.itemDescription} onChange={set("itemDescription")} rows={3} className="w-full rounded-xl bg-input px-4 py-3 text-black outline-none border border-transparent focus:border-orange/50 focus:bg-white" />
          </Field>
        </Card>
      </div>

      <Card className="p-6 lg:sticky lg:top-10 space-y-4">
        <h2 className="font-black text-navy">Summary</h2>
        {quote ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-navy/60">Price per kg</dt><dd className="font-bold">{money(quote.pricePerKg, quote.currency)}</dd></div>
            {quote.subtotal != null && <div className="flex justify-between"><dt className="text-navy/60">Subtotal</dt><dd className="font-bold">{money(quote.subtotal, quote.currency)}</dd></div>}
            {quote.documentationFee != null && <div className="flex justify-between"><dt className="text-navy/60">Documentation</dt><dd className="font-bold">{money(quote.documentationFee, quote.currency)}</dd></div>}
            {quote.deliveryDays != null && <div className="flex justify-between"><dt className="text-navy/60">Delivery</dt><dd className="font-bold">{quote.deliveryDays} days</dd></div>}
            <div className="flex justify-between border-t border-navy/10 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-black text-orange">{money(quote.totalCost, quote.currency)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-navy/60">{quoting ? "Calculating…" : "Enter the route and weight to see the price."}</p>
        )}
        <Button type="submit" loading={paying} disabled={!quote} className="w-full">Pay with card</Button>
        <Button type="button" variant="navy" disabled={!quote || paying} onClick={payByWallet} className="w-full">Pay from wallet</Button>
      </Card>

      <PinModal open={pinOpen} onClose={() => setPinOpen(false)} onPin={confirmWallet} />
    </form>
  );
}
