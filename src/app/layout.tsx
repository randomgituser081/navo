import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import { LoaderHost } from "@/components/loader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navo Plus",
  description: "Ship, shop and pay across Nigeria and the UK.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
          <LoaderHost />
        </ToastProvider>
      </body>
    </html>
  );
}
