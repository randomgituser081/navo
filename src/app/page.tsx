import { Photo } from "@/components/photo";
import Link from "next/link";
import { Logo } from "@/components/ui";

const features = [
  { title: "Cargo", text: "Lodge shipments between Nigeria and the UK and track them live.", photo: "courier" as const },
  { title: "Shop4Me", text: "Amazon, Naija Shop and stores — we buy, you relax.", photo: "relax" as const },
  { title: "Wallet & FX", text: "Hold NGN and GBP and swap at today's rates.", photo: "phone" as const },
  { title: "Bills", text: "Airtime, data, TV and electricity in seconds.", photo: "payments" as const },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="font-bold text-navy px-4 py-2">Log in</Link>
          <Link href="/register" className="font-bold text-white bg-orange rounded-xl px-5 py-2.5">Get started</Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-orange font-bold tracking-widest text-sm">NIGERIA ⇄ UNITED KINGDOM</p>
          <h1 className="text-5xl sm:text-6xl font-black text-navy leading-[1.05] mt-4">Ship, shop and pay — all in one place.</h1>
          <p className="text-lg text-navy/70 mt-6 max-w-lg">Navo Plus moves your parcels, buys from your favourite stores and keeps your money moving between naira and pounds.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="font-bold text-white bg-orange rounded-xl px-6 py-3.5">Create a free account</Link>
            <Link href="/login" className="font-bold text-navy border border-navy/20 rounded-xl px-6 py-3.5">I have an account</Link>
          </div>
        </div>
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
          <Photo name="courier" decorative={false} className="size-full" />
        </div>
      </section>

      <section className="bg-page py-20">
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl overflow-hidden">
              <Photo name={f.photo} className="h-44 w-full" />
              <div className="p-5">
                <h3 className="font-black text-navy text-lg">{f.title}</h3>
                <p className="text-sm text-navy/70 mt-1">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-navy/60">© {new Date().getFullYear()} Navo Plus</footer>
    </div>
  );
}
