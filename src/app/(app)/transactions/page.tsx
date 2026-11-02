"use client";

import { useEffect, useState } from "react";
import { listOf } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, Input, PageLoader } from "@/components/ui";
import { TransactionRow, type Transaction } from "@/components/wallet";

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  // Debounce typing into the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const path = search
    ? `/transactions/search?q=${encodeURIComponent(search)}`
    : `/transactions/history?page=${page}&limit=${PAGE_SIZE}`;
  const { data, loading } = useApi(path);
  const items = listOf<Transaction>(data);
  const total = Number(data?.total ?? items.length);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Transactions</h1>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by reference, type or amount" />
      <Card className="px-6">
        {loading ? (
          <PageLoader />
        ) : items.length ? (
          <div className="divide-y divide-navy/5">{items.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</div>
        ) : (
          <EmptyState title={search ? "No matching transactions" : "No transactions yet"} />
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
