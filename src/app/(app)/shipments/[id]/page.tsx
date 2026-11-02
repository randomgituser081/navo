"use client";

import Link from "next/link";
import { use } from "react";
import { dateTime, money, titleCase } from "@/lib/format";
import { SHIPMENT_STEPS, stepIndex } from "@/lib/shipping";
import { useApi } from "@/lib/use-api";
import { Badge, Card, EmptyState, PageLoader, statusTone } from "@/components/ui";

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useApi(`/shipments/${encodeURIComponent(id)}`);
  const s = data?.data ?? data?.shipment ?? data;

  if (loading) return <PageLoader />;
  if (error || !s?.id) return <EmptyState title="Shipment not found" text={error ?? undefined} action={<Link href="/shipments" className="font-bold text-orange">Back to shipments</Link>} />;

  const current = stepIndex(s.shipmentStatus);
  const cancelled = /cancel/i.test(s.shipmentStatus ?? "");
  const rows: [string, string | undefined][] = [
    ["Tracking ID", s.trackingId],
    ["Route", `${s.locationFrom} → ${s.locationTo}`],
    ["Pick-up", [s.pickupLocation, s.pickupAddress].filter(Boolean).join(", ")],
    ["Drop-off", [s.dropoffLocation, s.dropoffAddress].filter(Boolean).join(", ")],
    ["Delivery station", s.deliveryStation],
    ["Weight", `${s.weight} kg`],
    ["Goods", [titleCase(s.goodsType), s.itemName].filter(Boolean).join(" · ")],
    ["Details", s.itemDescription],
    ["Delivery timeline", s.deliveryTimeline],
    ["Lodged", dateTime(s.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <Link href="/shipments" className="text-sm font-bold text-orange">← Shipments</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">{s.itemName || "Shipment"}</h1>
        <Badge tone={statusTone(s.shipmentStatus)}>{titleCase(s.shipmentStatus || "pending")}</Badge>
      </div>

      {!cancelled && (
        <Card className="p-6">
          <ol className="grid grid-cols-3 sm:grid-cols-6 gap-y-5">
            {SHIPMENT_STEPS.map((step, i) => (
              <li key={step.key} className="flex flex-col items-center text-center gap-2">
                <span className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= current ? "bg-orange text-white" : "bg-navy/5 text-navy/40"}`}>{i < current ? "✓" : i + 1}</span>
                <span className={`text-xs ${i <= current ? "text-navy font-bold" : "text-navy/50"}`}>{step.label}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <Card className="p-6">
          <dl className="divide-y divide-navy/5">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-navy/60">{k}</dt>
                <dd className="font-medium text-navy text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-sm text-navy/60">Total cost</p>
          <p className="text-3xl font-black text-navy">{money(s.totalCost, s.currency)}</p>
          <p className="text-sm">Payment: <Badge tone={statusTone(s.paymentStatus)}>{titleCase(s.paymentStatus || "pending")}</Badge></p>
          {s.paymentMethod && <p className="text-sm text-navy/60">via {titleCase(s.paymentMethod)}</p>}
        </Card>
      </div>
    </div>
  );
}
