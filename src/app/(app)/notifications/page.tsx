"use client";

import { useState } from "react";
import { listOf, navo } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, PageLoader } from "@/components/ui";
import { useToast } from "@/components/toast";

type Notification = { id: string; title: string; message: string; isRead: boolean; type?: string; createdAt?: string };

export default function NotificationsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi(`/notifications?page=${page}&limit=20`);
  const items = listOf<Notification>(data);
  const total = Number(data?.total ?? items.length);

  async function markRead(n: Notification) {
    if (n.isRead) return;
    try {
      await navo.patch(`/notifications/${n.id}/read`);
      reload();
    } catch (err) {
      toast((err as Error).message, "danger");
    }
  }

  async function markAll() {
    try {
      await navo.patch("/notifications/read-all");
      reload();
    } catch (err) {
      toast((err as Error).message, "danger");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">Notifications</h1>
        {items.some((n) => !n.isRead) && <Button variant="outline" onClick={markAll} className="h-10">Mark all as read</Button>}
      </div>
      <Card className="divide-y divide-navy/5">
        {loading ? (
          <PageLoader />
        ) : items.length ? (
          items.map((n) => (
            <button key={n.id} onClick={() => markRead(n)} className="w-full text-left flex gap-4 p-5 hover:bg-navy/[0.02]">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-orange"}`} />
              <span className="flex-1 min-w-0">
                <span className={`block text-navy ${n.isRead ? "font-medium" : "font-bold"}`}>{n.title}</span>
                <span className="block text-sm text-navy/70 mt-0.5">{n.message}</span>
                <span className="block text-xs text-navy/40 mt-1.5">{dateTime(n.createdAt)}</span>
              </span>
            </button>
          ))
        ) : (
          <EmptyState title="You're all caught up" text="New notifications will show up here." />
        )}
      </Card>
      {total > page * 20 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Older notifications</Button>
        </div>
      )}
    </div>
  );
}
