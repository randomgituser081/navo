"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { auth } from "@/lib/api";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function VerifyPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return toast("Enter the code from your email", "danger");
    setLoading(true);
    try {
      await auth("verify-account", { email, verificationCode: code.trim() });
      toast("Email verified. Welcome to Navo!", "success");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const res = await auth("resend-otp", { email });
      toast(res?.message ?? "A new code is on its way", "success");
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-navy">Verify your email</h1>
        <p className="text-navy/60 mt-1">Enter the code we sent to <b className="text-navy">{email || "your email"}</b>.</p>
      </div>
      <Field label="Verification code">
        <Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className="tracking-[0.4em] text-lg" maxLength={8} />
      </Field>
      <Button type="submit" loading={loading} className="w-full">Verify</Button>
      <Button type="button" variant="ghost" loading={resending} onClick={resend} className="w-full">Resend code</Button>
    </form>
  );
}
