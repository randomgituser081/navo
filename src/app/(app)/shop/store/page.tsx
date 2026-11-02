"use client";

import { navo } from "@/lib/api";
import { Catalog } from "@/components/catalog";
import { toNumber } from "@/components/shop";

export default function StorePage() {
  return (
    <Catalog
      cartKey="store"
      title="Navo Store"
      intro="Products stocked and shipped by Navo."
      listPath="/products?page=1&limit=30"
      searchPath={(q) => `/products/search?query=${encodeURIComponent(q)}`}
      mapProduct={(p) => ({
        id: p.id,
        name: p.name,
        price: toNumber(p.price),
        currency: (p.currency ?? "NGN").toUpperCase(),
        image: p.image ?? p.images?.[0],
        available: !/out_of_stock/i.test(p.productStatus ?? ""),
      })}
      checkout={async (lines, address, total) => {
        const res = await navo.post("/orders/place-order", {
          products: lines.map((l) => ({ product_id: l.id, quantity: l.quantity })),
          cartTotal: total,
          paymentMethod: "nomba",
          shippingAddress: { ...address, quantity: lines.reduce((n, l) => n + l.quantity, 0) },
        });
        const link = res?.checkoutLink ?? res?.data?.checkoutLink;
        if (!link) throw new Error("Could not start the payment. Please try again.");
        return link;
      }}
    />
  );
}
