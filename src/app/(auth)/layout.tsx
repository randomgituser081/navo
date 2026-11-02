import { Photo } from "@/components/photo";
import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <aside className="relative hidden lg:block overflow-hidden">
        <Photo name="courier" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="absolute bottom-0 p-12 text-white max-w-lg">
          <h2 className="text-4xl font-black leading-tight">Effortless deliveries between Nigeria and the UK.</h2>
          <p className="mt-4 text-white/80">Ship parcels, shop Amazon and Naija stores, swap currencies and pay bills — all in one place.</p>
        </div>
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="mb-10"><Logo /></Link>
        <div className="flex-1 flex items-start lg:items-center">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
