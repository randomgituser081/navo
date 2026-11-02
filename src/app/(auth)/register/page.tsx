"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { auth } from "@/lib/api";
import { Button, Field, Input, PasswordInput, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

const COUNTRIES = [
  { name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
];
// Same rules as the API (navo_api register.dto.ts).
const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const ALLOWED_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com"];

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", dial: "+234", phone: "", email: "",
    country: "Nigeria", password: "", confirmPassword: "", referralCode: "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!form.firstName.trim() || !form.lastName.trim()) return toast("Enter your first and last name", "danger");
    if (!form.phone.trim()) return toast("Enter your phone number", "danger");
    if (!ALLOWED_DOMAINS.includes(email.split("@")[1] ?? "")) return toast("Use a Gmail, Outlook or Yahoo email address", "danger");
    if (!STRONG.test(form.password)) return toast("Password needs 8+ characters with upper and lower case, a number and a symbol", "danger");
    if (form.password !== form.confirmPassword) return toast("Passwords do not match", "danger");

    setLoading(true);
    try {
      await auth("register", {
        accountName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        phoneNumber: `${form.dial}-${form.phone.trim().replace(/^0/, "")}`,
        email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        countryOfResidence: form.country,
        ...(form.referralCode.trim() && { referralCode: form.referralCode.trim() }),
      });
      toast("Account created. Check your email for the verification code.", "success");
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-navy">Good to have you here!</h1>
        <p className="text-navy/60 mt-1">Let&apos;s get you set up in a few clicks.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input value={form.firstName} onChange={set("firstName")} autoComplete="given-name" /></Field>
        <Field label="Last name"><Input value={form.lastName} onChange={set("lastName")} autoComplete="family-name" /></Field>
      </div>
      <Field label="Phone number">
        <div className="flex gap-2">
          <Select value={form.dial} onChange={set("dial")} className="w-32" aria-label="Dial code">
            {COUNTRIES.map((c) => <option key={c.dial} value={c.dial}>{c.name === "Nigeria" ? "NG" : "UK"} {c.dial}</option>)}
          </Select>
          <Input type="tel" inputMode="numeric" value={form.phone} onChange={set("phone")} placeholder="8012345678" autoComplete="tel-national" />
        </div>
      </Field>
      <Field label="Email" hint="Gmail, Outlook or Yahoo addresses only.">
        <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" autoCapitalize="none" />
      </Field>
      <Field label="Country of residence">
        <Select value={form.country} onChange={set("country")}>
          {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Password" hint="At least 8 characters with upper and lower case, a number and a symbol.">
        <PasswordInput value={form.password} onChange={set("password")} autoComplete="new-password" />
      </Field>
      <Field label="Confirm password">
        <PasswordInput value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
      </Field>
      <Field label="Referral code (optional)">
        <Input value={form.referralCode} onChange={set("referralCode")} autoCapitalize="characters" />
      </Field>
      <Button type="submit" loading={loading} className="w-full">Create account</Button>
      <p className="text-center text-sm text-navy/70">
        Already have an account? <Link href="/login" className="font-bold text-orange">Log in</Link>
      </p>
    </form>
  );
}
