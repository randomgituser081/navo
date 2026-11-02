"use client";

import { NavoLoader } from "./loader";
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-start font-black text-2xl tracking-tight ${className}`}>
      <span className="text-orange">Navo</span>
      <span className={`${light ? "text-white" : "text-navy"} text-xl -mt-1`}>+</span>
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "navy" | "outline" | "ghost";
  loading?: boolean;
};

export function Button({ variant = "primary", loading, className = "", children, disabled, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-orange text-white hover:bg-[#e65c00]",
    navy: "bg-navy text-white hover:bg-navy-700",
    outline: "border border-navy/20 text-navy bg-white hover:bg-navy/5",
    ghost: "text-navy hover:bg-navy/5",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 h-12 font-bold transition disabled:opacity-60 disabled:cursor-not-allowed ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4 border-2" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-navy mb-2">{label}</span>
      {children}
      {hint && <span className="block text-xs text-navy/60 mt-1.5">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full h-12 rounded-xl bg-input px-4 text-black placeholder:text-black/30 outline-none border border-transparent focus:border-orange/50 focus:bg-white transition";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="pr-16" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-navy/60 hover:text-navy">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23003366' stroke-width='2' fill='none'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center] pr-10 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,51,102,0.06)] ${className}`}>{children}</div>;
}

export function Spinner({ className = "size-6 border-[3px]" }: { className?: string }) {
  return <span className={`inline-block rounded-full border-current border-r-transparent animate-spin ${className}`} aria-label="Loading" />;
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-16">
      <NavoLoader />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto size-14 rounded-full bg-navy/5 flex items-center justify-center text-2xl mb-4">∅</div>
      <p className="font-bold text-navy">{title}</p>
      {text && <p className="text-sm text-navy/60 mt-1">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button onClick={onClose} className="size-9 rounded-full hover:bg-navy/5 text-navy text-xl" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "success" | "danger" | "warning" | "neutral"; children: ReactNode }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    warning: "bg-amber-50 text-amber-700",
    neutral: "bg-navy/5 text-navy",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles}`}>{children}</span>;
}

export function statusTone(status?: string): "success" | "danger" | "warning" | "neutral" {
  const s = (status ?? "").toLowerCase();
  if (["successful", "success", "completed", "delivered", "paid"].some((k) => s.includes(k))) return "success";
  if (["failed", "cancel", "declined", "rejected"].some((k) => s.includes(k))) return "danger";
  if (["pending", "processing", "initiated", "transit"].some((k) => s.includes(k))) return "warning";
  return "neutral";
}
