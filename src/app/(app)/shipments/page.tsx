"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listOf, totalOf } from "@/lib/api";
import { dateTime, money, titleCase } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Badge, Button, Card, EmptyState, Input, PageLoader, statusTone } from "@/components/ui";

const PAGE_SIZE = 20;

export type Shipment = {
  id: string;
  trackingId?: string;
  locationFrom: string;
  locationTo: string;
  weight: number;
  itemName?: string | null;
  goodsType?: string;
  totalCost?: number;
  currency?: string;
  shipmentStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
};

export default function ShipmentsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, loading } = useApi(search ? `/shipments/search?q=${encodeURIComponent(search)}` : `/shipments?page=${page}&limit=${PAGE_SIZE}`);
  const items = listOf<Shipment>(data);
  const pages = Math.max(1, Math.ceil(totalOf(data, items.length) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">Shipments</h1>
        <Link href="/shipments/new" className="font-bold text-white bg-orange rounded-xl px-5 py-3">+ Lodge shipment</Link>
      </div>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tracking ID or item name" />
      <Card className="divide-y divide-navy/5">
        {loading ? (
          <PageLoader />
        ) : items.length ? (
          items.map((s) => (
            <Link key={s.id} href={`/shipments/${s.id}`} className="flex flex-wrap items-center gap-4 p-5 hover:bg-navy/[0.02]">
              <div className="size-11 rounded-full bg-navy/5 flex items-center justify-center text-navy">📦</div>
              <div className="flex-1 min-w-40">
                <p className="font-bold text-navy">{s.itemName || titleCase(s.goodsType) || "Shipment"}</p>
                <p className="text-xs text-navy/50">{s.locationFrom} → {s.locationTo} · {s.weight} kg · {dateTime(s.createdAt)}</p>
                {s.trackingId && <p className="text-xs text-navy/50">Tracking: {s.trackingId}</p>}
              </div>
              <div className="text-right space-y-1">
                {s.totalCost ? <p className="font-bold text-navy">{money(s.totalCost, s.currency)}</p> : null}
                <Badge tone={statusTone(s.shipmentStatus)}>{titleCase(s.shipmentStatus || "pending")}</Badge>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            title={search ? "No matching shipments" : "No shipments yet"}
            text={search ? undefined : "Lodge your first shipment between Nigeria and the UK."}
            action={!search && <Link href="/shipments/new" className="font-bold text-white bg-orange rounded-xl px-5 py-3">Lodge shipment</Link>}
          />
        )}
      </Card>
      {!search && pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-navy/60">Page {page} of {pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
