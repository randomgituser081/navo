"use client";

import { useState } from "react";
import { listOf, totalOf } from "@/lib/api";
import { dateTime, money, titleCase } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Badge, Button, Card, EmptyState, PageLoader, statusTone } from "@/components/ui";

const TABS = [
  { key: "CARTS", label: "Amazon" },
  { key: "VENDORS", label: "Naija Shop" },
  { key: "ORDER", label: "Navo Store" },
  { key: "SHOPFORME", label: "Shop with link" },
];

export default function OrdersPage() {
  const [tab, setTab] = useState("CARTS");
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(`/orders?category=${tab}&page=${page}&limit=20`);
  const orders = listOf<any>(data);
  const pages = Math.max(1, Math.ceil(totalOf(data, orders.length) / 20));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">My orders</h1>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${tab === t.key ? "bg-navy text-white" : "bg-white text-navy hover:bg-navy/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card className="divide-y divide-navy/5">
        {loading ? (
          <PageLoader />
        ) : orders.length ? (
          orders.map((o) => {
            const items: any[] = o.items ?? o.orderItems ?? o.cartItems ?? o.products ?? [];
            const name = items[0]?.product?.name ?? items[0]?.name ?? items[0]?.title ?? items[0]?.item ?? o.itemName ?? o.item ?? "Order";
            const status = o.status ?? o.orderStatus ?? o.shipmentStatus ?? o.paymentStatus;
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-4 p-5">
                <div className="flex-1 min-w-40">
                  <p className="font-bold text-navy line-clamp-1">{name}{items.length > 1 ? ` +${items.length - 1} more` : ""}</p>
                  <p className="text-xs text-navy/50">{dateTime(o.createdAt)}{o.trackingId ? ` · ${o.trackingId}` : ""}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-navy">{money(o.totalAmount ?? o.cartTotal ?? o.totalAmountNGN ?? o.amount, o.currency ?? "NGN")}</p>
                  {status && <Badge tone={statusTone(status)}>{titleCase(status)}</Badge>}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState title="No orders yet" text="Orders you place in Shop4Me show up here." />
        )}
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-navy/60">Page {page} of {pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
