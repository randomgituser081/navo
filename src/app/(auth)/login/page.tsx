"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { auth, ApiError } from "@/lib/api";
import { Button, Field, Input, PasswordInput } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) return toast("Enter your email and password", "danger");
    setLoading(true);
    try {
      await auth("login", { email: form.email.trim().toLowerCase(), password: form.password.trim() });
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      const message = (err as Error).message;
      // Unverified accounts must finish OTP verification first.
      if (err instanceof ApiError && /not verified/i.test(message)) {
        await auth("resend-otp", { email: form.email.trim().toLowerCase() }).catch(() => null);
        toast("Verify your email to continue. We've sent you a new code.", "info");
        return router.push(`/verify?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
      }
      toast(message, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-navy">Welcome back</h1>
        <p className="text-navy/60 mt-1">Log in to your Navo account.</p>
      </div>
      <Field label="Email">
        <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@gmail.com" />
      </Field>
      <Field label="Password">
        <PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-bold text-orange">Forgot password?</Link>
      </div>
      <Button type="submit" loading={loading} className="w-full">Log in</Button>
      <p className="text-center text-sm text-navy/70">
        New to Navo? <Link href="/register" className="font-bold text-orange">Create an account</Link>
      </p>
    </form>
  );
}
