"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { listOf, navo } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { PinModal } from "@/components/pin";
import { useToast } from "@/components/toast";

type Tab = "airtime" | "data" | "tv" | "electricity";
const TABS: { key: Tab; label: string }[] = [
  { key: "airtime", label: "Airtime" },
  { key: "data", label: "Data" },
  { key: "tv", label: "Cable TV" },
  { key: "electricity", label: "Electricity" },
];
const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];
const CABLE = [
  { value: "dstv", label: "DStv" },
  { value: "gotv", label: "GOtv" },
  { value: "startimes", label: "StarTimes" },
];
const NG_PHONE = /^0\d{10}$/;

/** Everything here is paid from the NGN wallet and confirmed with the transaction PIN. */
export default function BillsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("airtime");
  const [pending, setPending] = useState<{ path: string; body: Record<string, unknown>; summary: string } | null>(null);

  async function pay(pin: string) {
    if (!pending) return;
    const res = await navo.post(pending.path, { ...pending.body, currency: "ngn", transactionPin: pin });
    setPending(null);
    toast(res?.message ?? "Payment successful", "success");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Bills &amp; top-ups</h1>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${tab === t.key ? "bg-navy text-white" : "bg-white text-navy hover:bg-navy/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card className="p-6 max-w-xl">
        {tab === "airtime" && <AirtimeForm onReady={setPending} />}
        {tab === "data" && <DataForm onReady={setPending} />}
        {tab === "tv" && <CableForm onReady={setPending} />}
        {tab === "electricity" && <ElectricityForm onReady={setPending} />}
      </Card>
      <PinModal open={!!pending} onClose={() => setPending(null)} onPin={pay} title={pending?.summary} />
    </div>
  );
}

type Ready = (p: { path: string; body: Record<string, unknown>; summary: string }) => void;

function AirtimeForm({ onReady }: { onReady: Ready }) {
  const toast = useToast();
  const [form, setForm] = useState({ networkProvider: "mtn", phoneNumber: "", amount: "" });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!NG_PHONE.test(form.phoneNumber)) return toast("Enter an 11-digit phone number, e.g. 08012345678", "danger");
    if (!Number(form.amount)) return toast("Enter an amount", "danger");
    if (Number(form.amount) < 100) return toast("Airtime must be at least ₦100", "danger");
    onReady({ path: "/vtu/purchase-airtime", body: { ...form, amount: Number(form.amount) }, summary: `${money(form.amount, "NGN")} airtime to ${form.phoneNumber}` });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <NetworkPicker value={form.networkProvider} onChange={(v) => setForm({ ...form, networkProvider: v })} />
      <Field label="Phone number"><Input inputMode="numeric" maxLength={11} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "") })} placeholder="08012345678" /></Field>
      <Field label="Amount (₦)"><Input type="number" min="100" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
      <Button type="submit" className="w-full">Buy airtime</Button>
    </form>
  );
}

function DataForm({ onReady }: { onReady: Ready }) {
  const toast = useToast();
  const { data } = useApi("/vtu/data-plans");
  const [form, setForm] = useState({ networkProvider: "mtn", phoneNumber: "", dataPlan: "" });
  const plans: { plan: string; amount: number }[] = data?.data?.[form.networkProvider] ?? [];
  const selected = plans.find((p) => p.plan === form.dataPlan);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!NG_PHONE.test(form.phoneNumber)) return toast("Enter an 11-digit phone number, e.g. 08012345678", "danger");
    if (!form.dataPlan) return toast("Choose a data plan", "danger");
    onReady({ path: "/vtu/purchase-data", body: form, summary: `${form.dataPlan} to ${form.phoneNumber}` });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <NetworkPicker value={form.networkProvider} onChange={(v) => setForm({ ...form, networkProvider: v, dataPlan: "" })} />
      <Field label="Phone number"><Input inputMode="numeric" maxLength={11} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "") })} placeholder="08012345678" /></Field>
      <Field label="Data plan">
        <Select value={form.dataPlan} onChange={(e) => setForm({ ...form, dataPlan: e.target.value })}>
          <option value="">{data ? "Choose a plan" : "Loading plans…"}</option>
          {plans.map((p) => <option key={p.plan} value={p.plan}>{p.plan} — {money(p.amount, "NGN")}</option>)}
        </Select>
      </Field>
      <Button type="submit" className="w-full">{selected ? `Pay ${money(selected.amount, "NGN")}` : "Buy data"}</Button>
    </form>
  );
}

function CableForm({ onReady }: { onReady: Ready }) {
  const toast = useToast();
  const [form, setForm] = useState({ cableTvType: "dstv", customerId: "", pkg: "" });
  const { data } = useApi(`/vtu/cable-tvs?cableTvType=${form.cableTvType}`);
  const packages = useMemo(() => listOf<{ subScriptionType: string; amount: number }>(data), [data]);
  const pkg = packages.find((p) => p.subScriptionType === form.pkg);
  const customer = useCustomerLookup(form.customerId.length >= 10 ? `/vtu/cable-tv-customer/${form.cableTvType}/${form.customerId}` : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId) return toast("Enter the smartcard / IUC number", "danger");
    if (!pkg) return toast("Choose a package", "danger");
    onReady({
      path: "/vtu/purchase-cabletv",
      body: { cableTvType: form.cableTvType, customerId: form.customerId, amount: Number(pkg.amount) },
      summary: `${pkg.subScriptionType} for ${customer.name || form.customerId}`,
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Provider">
        <Select value={form.cableTvType} onChange={(e) => setForm({ ...form, cableTvType: e.target.value, pkg: "" })}>
          {CABLE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Smartcard / IUC number" hint={customer.hint}>
        <Input inputMode="numeric" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <Field label="Package">
        <Select value={form.pkg} onChange={(e) => setForm({ ...form, pkg: e.target.value })}>
          <option value="">{data ? "Choose a package" : "Loading packages…"}</option>
          {packages.map((p) => <option key={p.subScriptionType} value={p.subScriptionType}>{p.subScriptionType} — {money(p.amount, "NGN")}</option>)}
        </Select>
      </Field>
      <Button type="submit" className="w-full">{pkg ? `Pay ${money(pkg.amount, "NGN")}` : "Pay subscription"}</Button>
    </form>
  );
}

function ElectricityForm({ onReady }: { onReady: Ready }) {
  const toast = useToast();
  const { data } = useApi("/vtu/discos");
  const discos = listOf<{ id: string; name: string }>(data);
  const [form, setForm] = useState({ disco: "", meterType: "PREPAID", customerId: "", amount: "" });
  const customer = useCustomerLookup(form.disco && form.customerId.length >= 10 ? `/vtu/electricity-customer/${form.disco}/${form.customerId}` : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.disco) return toast("Choose your electricity company", "danger");
    if (!form.customerId) return toast("Enter the meter number", "danger");
    if (!Number(form.amount)) return toast("Enter an amount", "danger");
    if (Number(form.amount) < 500) return toast("Electricity must be at least ₦500", "danger");
    onReady({ path: "/vtu/purchase-electricity", body: { ...form, amount: Number(form.amount) }, summary: `${money(form.amount, "NGN")} electricity for ${customer.name || form.customerId}` });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Electricity company">
        <Select value={form.disco} onChange={(e) => setForm({ ...form, disco: e.target.value })}>
          <option value="">{data ? "Choose company" : "Loading…"}</option>
          {discos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </Field>
      <Field label="Meter type">
        <Select value={form.meterType} onChange={(e) => setForm({ ...form, meterType: e.target.value })}>
          <option value="PREPAID">Prepaid</option>
          <option value="POSTPAID">Postpaid</option>
        </Select>
      </Field>
      <Field label="Meter number" hint={customer.hint}>
        <Input inputMode="numeric" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <Field label="Amount (₦)"><Input type="number" min="500" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
      <Button type="submit" className="w-full">Buy electricity</Button>
    </form>
  );
}

function NetworkPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Network">
      <div className="grid grid-cols-4 gap-2">
        {NETWORKS.map((n) => (
          <button
            type="button"
            key={n.value}
            onClick={() => onChange(n.value)}
            className={`h-12 rounded-xl font-bold text-sm border-2 ${value === n.value ? "border-orange bg-orange-100 text-navy" : "border-transparent bg-input text-navy/70"}`}
          >
            {n.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Looks up the customer name for a smartcard or meter number once it looks complete. */
function useCustomerLookup(path: string | null) {
  const [state, setState] = useState<{ name: string; hint?: string }>({ name: "" });
  useEffect(() => {
    if (!path) {
      setState({ name: "" });
      return;
    }
    let cancelled = false;
    setState({ name: "", hint: "Checking…" });
    const t = setTimeout(() => {
      navo
        .get(path)
        .then((res) => {
          const d = res?.data ?? res;
          const name = d?.customerName ?? d?.name ?? d?.Customer_Name ?? "";
          if (!cancelled) setState({ name, hint: name ? `✓ ${name}` : "Number found" });
        })
        .catch((err) => !cancelled && setState({ name: "", hint: (err as Error).message }));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [path]);
  return state;
}
