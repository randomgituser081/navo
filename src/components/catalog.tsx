"use client";

import { useEffect, useState } from "react";
import { listOf } from "@/lib/api";
import { money } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, Input, PageLoader } from "./ui";
import { AddressFields, EMPTY_ADDRESS, QuantityStepper, addressProblem, useCart, type Address, type CartLine } from "./shop";
import { useToast } from "./toast";

export type Product = { id: string; name: string; price: number; currency: string; image?: string; subtitle?: string; available?: boolean };

/**
 * Search → product grid → cart → address → hosted checkout. Shared by the Navo store,
 * Naija Shop and Amazon pages; each passes its endpoints, a product mapper and a checkout.
 */
export function Catalog({
  cartKey,
  title,
  intro,
  listPath,
  searchPath,
  mapProduct,
  checkout,
  defaultQuery = "",
}: {
  cartKey: string;
  title: string;
  intro: string;
  listPath: string | null;
  searchPath: (q: string) => string;
  mapProduct: (raw: any) => Product;
  checkout: (lines: CartLine[], address: Address, total: number) => Promise<string>;
  defaultQuery?: string;
}) {
  const toast = useToast();
  const cart = useCart(cartKey);
  const [query, setQuery] = useState(defaultQuery);
  const [search, setSearch] = useState(defaultQuery);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [checkingOut, setCheckingOut] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);

  const path = search ? searchPath(search) : listPath;
  const { data, loading, error } = useApi(path);
  const raw = listOf(data).length ? listOf(data) : listOf(data?.data);
  const products = raw.map(mapProduct).filter((p) => p.id && p.name);
  const currency = cart.lines[0]?.currency ?? products[0]?.currency ?? "NGN";

  async function pay() {
    const problem = addressProblem(address);
    if (problem) return toast(problem, "danger");
    setBusy(true);
    try {
      const link = await checkout(cart.lines, address, cart.total);
      cart.clear();
      window.location.href = link;
    } catch (err) {
      toast((err as Error).message, "danger");
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">{title}</h1>
          <p className="text-navy/60">{intro}</p>
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
        {loading ? (
          <PageLoader />
        ) : products.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-white p-3 flex items-center justify-center">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="text-4xl">🛍️</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-sm font-bold text-navy line-clamp-2">{p.name}</p>
                  {p.subtitle && <p className="text-xs text-navy/50 mt-0.5 line-clamp-1">{p.subtitle}</p>}
                  <p className="font-black text-navy mt-2">{money(p.price, p.currency)}</p>
                  <Button
                    variant="outline"
                    className="mt-3 h-10 text-sm"
                    disabled={p.available === false}
                    onClick={() => {
                      cart.add({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.image });
                      toast("Added to cart", "success");
                    }}
                  >
                    {p.available === false ? "Out of stock" : "Add to cart"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card><EmptyState title={error ? "Couldn't load products" : "No products found"} text={error ?? "Try a different search."} /></Card>
        )}
      </div>

      <Card className="p-6 lg:sticky lg:top-10 space-y-4">
        <h2 className="font-black text-navy">Cart {cart.count ? `(${cart.count})` : ""}</h2>
        {cart.lines.length ? (
          <>
            <ul className="space-y-3 max-h-72 overflow-y-auto">
              {cart.lines.map((l) => (
                <li key={l.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy line-clamp-1">{l.name}</p>
                    <p className="text-xs text-navy/50">{money(l.price, l.currency)}</p>
                  </div>
                  <QuantityStepper value={l.quantity} onChange={(n) => cart.setQuantity(l.id, n)} />
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-navy/10 pt-3">
              <span className="font-bold">Total</span>
              <span className="font-black text-orange">{money(cart.total, currency)}</span>
            </div>
            {checkingOut ? (
              <div className="space-y-4">
                <AddressFields value={address} onChange={setAddress} />
                <Button onClick={pay} loading={busy} className="w-full">Pay now</Button>
                <Button variant="ghost" onClick={() => setCheckingOut(false)} className="w-full">Back to cart</Button>
              </div>
            ) : (
              <Button onClick={() => setCheckingOut(true)} className="w-full">Checkout</Button>
            )}
          </>
        ) : (
          <p className="text-sm text-navy/60">Your cart is empty.</p>
        )}
      </Card>
    </div>
  );
}
