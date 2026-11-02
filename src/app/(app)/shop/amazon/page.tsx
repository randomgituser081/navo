"use client";

import { navo } from "@/lib/api";
import { Catalog } from "@/components/catalog";
import { toNumber } from "@/components/shop";

/** Amazon via Shop4Me: Navo buys and ships it. Cart is created with the address, then paid. */
export default function AmazonPage() {
  return (
    <Catalog
      cartKey="amazon"
      title="Shop Amazon"
      intro="Find it on Amazon — we'll buy it and ship it to you."
      listPath={null}
      defaultQuery="phones"
      searchPath={(q) => `/amazonshop/search?query=${encodeURIComponent(q)}`}
      mapProduct={(p) => ({
        id: p.asin,
        name: p.product_title ?? p.title,
        price: toNumber(p.product_price ?? p.price),
        currency: (p.currency ?? "USD").toUpperCase(),
        image: p.product_photo ?? p.image ?? p.photo,
        subtitle: p.product_star_rating ? `★ ${p.product_star_rating}` : undefined,
      })}
      checkout={async (lines, address) => {
        const cart = await navo.post("/amazonshop/add-to-cart", {
          items: lines.map((l) => ({ asin: l.id, quantity: l.quantity })),
          shippingAddress: address,
        });
        const cartId = cart?.cartId ?? cart?.data?.cartId;
        if (!cartId) throw new Error("Could not create the cart. Please try again.");
        const res = await navo.post(`/amazonshop/checkout/${encodeURIComponent(cartId)}`, { paymentMethod: "nomba" });
        const link = res?.checkoutLink ?? res?.data?.checkoutLink;
        if (!link) throw new Error("Could not start the payment. Please try again.");
        return link;
      }}
    />
  );
}
