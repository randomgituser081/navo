"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { auth } from "@/lib/api";
import { Button, Field, Input, PasswordInput } from "@/components/ui";
import { useToast } from "@/components/toast";

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

/** Three steps, as in the app: email → OTP → new password. */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setLoading(false);
    }
  }

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await auth("forgot-password", { email: email.trim().toLowerCase() });
      setUserId(res?.user?.id ?? "");
      toast(res?.message ?? "Code sent to your email", "success");
      setStep("code");
    });
  };

  const checkCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await auth("reset-password-otp", { email: email.trim().toLowerCase(), verificationCode: code.trim() });
      if (!userId && res?.user?.id) setUserId(res.user.id);
      setStep("password");
    });
  };

  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!STRONG.test(password.next)) return toast("Password needs 8+ characters with upper and lower case, a number and a symbol", "danger");
    if (password.next !== password.confirm) return toast("Passwords do not match", "danger");
    run(async () => {
      const res = await auth("reset-password", { userId, newPassword: password.next });
      toast(res?.message ?? "Password updated. Log in with your new password.", "success");
      router.replace("/login");
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-navy">Reset password</h1>
        <p className="text-navy/60 mt-1">
          {step === "email" && "Enter your account email and we'll send you a code."}
          {step === "code" && `Enter the code sent to ${email}.`}
          {step === "password" && "Choose a new password."}
        </p>
      </div>
      {step === "email" && (
        <form onSubmit={sendCode} className="space-y-5">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Button type="submit" loading={loading} className="w-full">Send code</Button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={checkCode} className="space-y-5">
          <Field label="Code"><Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className="tracking-[0.4em] text-lg" /></Field>
          <Button type="submit" loading={loading} className="w-full">Continue</Button>
        </form>
      )}
      {step === "password" && (
        <form onSubmit={savePassword} className="space-y-5">
          <Field label="New password"><PasswordInput value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><PasswordInput value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} autoComplete="new-password" /></Field>
          <Button type="submit" loading={loading} className="w-full">Save password</Button>
        </form>
      )}
      <p className="text-center text-sm"><Link href="/login" className="font-bold text-orange">Back to login</Link></p>
    </div>
  );
}
