"use client";

import { navo } from "@/lib/api";
import { Catalog } from "@/components/catalog";
import { toNumber } from "@/components/shop";

/** Naija Shop: products from Nigerian vendors. Order first, then pay for the order. */
export default function NaijaShopPage() {
  return (
    <Catalog
      cartKey="naija"
      title="Naija Shop"
      intro="Shop from Nigerian vendors and we'll deliver it."
      listPath="/vendors/products?page=1&limit=30"
      searchPath={(q) => `/vendors/search?query=${encodeURIComponent(q)}`}
      mapProduct={(p) => ({
        id: p.id,
        name: p.name,
        price: toNumber(p.price),
        currency: (p.currency ?? "NGN").toUpperCase(),
        image: p.image ?? p.images?.[0] ?? p.imageUrl,
        subtitle: p.vendor?.name ?? p.vendorName,
        available: p.isAvailable !== false && Number(p.stock ?? 1) > 0,
      })}
      checkout={async (lines, address) => {
        const order = await navo.post("/vendors/order", {
          items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
          shippingAddress: address,
        });
        const orderId = order?.data?.order?.id ?? order?.order?.id;
        if (!orderId) throw new Error("Could not create the order. Please try again.");
        const res = await navo.post("/vendors/pay", { orderId, paymentMethod: "nomba" });
        const link = res?.checkoutLink ?? res?.data?.checkoutLink;
        if (!link) throw new Error("Could not start the payment. Please try again.");
        return link;
      }}
    />
  );
}
