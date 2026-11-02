import { Photo } from "@/components/photo";
import Link from "next/link";

const STORES = [
  { href: "/shop/amazon", title: "Amazon", text: "Search Amazon, we buy and ship it.", photo: "relax" as const },
  { href: "/shop/naija", title: "Naija Shop", text: "Products from Nigerian vendors.", photo: "courier" as const },
  { href: "/shop/store", title: "Navo Store", text: "Items stocked by Navo.", photo: "payments" as const },
  { href: "/shop/link", title: "Shop with a link", text: "Paste a link from any online store.", photo: "phone" as const },
];

export default function ShopPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">Shop4Me</h1>
          <p className="text-navy/60">We shop, you relax.</p>
        </div>
        <Link href="/orders" className="font-bold text-navy border border-navy/20 rounded-xl px-5 py-3 bg-white">My orders</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {STORES.map((s) => (
          <Link key={s.href} href={s.href} className="group bg-white rounded-2xl overflow-hidden">
            <Photo name={s.photo} className="h-48 w-full group-hover:scale-[1.02] transition" />
            <div className="p-5">
              <p className="font-black text-navy text-lg">{s.title}</p>
              <p className="text-sm text-navy/60">{s.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
