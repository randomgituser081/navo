"use client";

import { useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Badge, Button, Card, Field, Input, PageLoader } from "@/components/ui";
import { useToast } from "@/components/toast";

/** Nigeria residents verify with BVN (+ SMS OTP); UK residents upload a selfie and photo ID. */
export default function KycPage() {
  const { data, loading, reload } = useApi("/profile");
  const user = data?.user;
  if (loading && !user) return <PageLoader />;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy">Verify your identity</h1>
        <Badge tone={user?.isKycVerified ? "success" : "warning"}>{user?.isKycVerified ? "Verified" : "Not verified"}</Badge>
      </div>
      {user?.isKycVerified ? (
        <Card className="p-6"><p className="text-navy">Your identity is verified. You have full access, including FX exchanges and referral rewards.</p></Card>
      ) : user?.countryOfResidence === "United Kingdom" ? (
        <UkKyc onDone={reload} />
      ) : (
        <BvnKyc onDone={reload} />
      )}
    </div>
  );
}

function BvnKyc({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState<"bvn" | "confirm" | "otp">("bvn");
  const [bvn, setBvn] = useState("");
  const [details, setDetails] = useState<{ name?: string; maskedPhone?: string }>({});
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setBusy(false);
    }
  }

  const lookUp = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(bvn)) return toast("Your BVN is 11 digits", "danger");
    run(async () => {
      const res = await navo.post("/verify/verify-details", { bvn });
      setDetails(res?.data ?? {});
      setStep("confirm");
    });
  };

  const confirm = (isConfirmed: boolean) =>
    run(async () => {
      try {
        await navo.post("/verify/confirm-user", { isConfirmed });
      } catch (err) {
        // Declining is answered with 400 "BVN verification cancelled" by design.
        if (isConfirmed) throw err;
      }
      if (isConfirmed) {
        toast("We've sent a code to the phone number on your BVN", "success");
        setStep("otp");
      } else {
        setStep("bvn");
        setBvn("");
      }
    });

  const verify = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await navo.patch("/verify/verify-user", { verificationCode: otp.trim() });
      toast("Identity verified", "success");
      onDone();
    });
  };

  return (
    <Card className="p-6 space-y-4">
      {step === "bvn" && (
        <form onSubmit={lookUp} className="space-y-4">
          <p className="text-sm text-navy/70">Enter your Bank Verification Number. You have 3 attempts every 24 hours.</p>
          <Field label="BVN"><Input inputMode="numeric" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} /></Field>
          <Button type="submit" loading={busy} className="w-full">Continue</Button>
        </form>
      )}
      {step === "confirm" && (
        <div className="space-y-4">
          <p className="text-navy">Is this you?</p>
          <div className="rounded-xl bg-page p-4">
            <p className="font-black text-navy text-lg">{details.name}</p>
            <p className="text-sm text-navy/60">Phone: {details.maskedPhone}</p>
          </div>
          <Button onClick={() => confirm(true)} loading={busy} className="w-full">Yes, send me a code</Button>
          <Button variant="ghost" onClick={() => confirm(false)} disabled={busy} className="w-full">No, that&apos;s not me</Button>
        </div>
      )}
      {step === "otp" && (
        <form onSubmit={verify} className="space-y-4">
          <Field label="Code sent to your BVN phone"><Input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} /></Field>
          <Button type="submit" loading={busy} className="w-full">Verify</Button>
          <Button type="button" variant="ghost" onClick={() => run(async () => { await navo.post("/verify/resend-verify-otp", {}); toast("New code sent", "success"); })} className="w-full">Resend code</Button>
        </form>
      )}
    </Card>
  );
}

function UkKyc({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [photoId, setPhotoId] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!selfie || !photoId) return toast("Add a selfie and a photo of your ID", "danger");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("selfie", selfie);
      form.append("photoid", photoId);
      await navo.post("/upload-image/facials", form);
      toast("Documents submitted", "success");
      onDone();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setBusy(false);
    }
  }

  const picker = (label: string, hint: string, file: File | null, onPick: (f: File | null) => void, capture?: "user" | "environment") => (
    <Field label={label} hint={hint}>
      <label className="flex items-center gap-4 rounded-xl bg-input p-3 cursor-pointer hover:bg-navy/5">
        <span className="size-16 rounded-lg bg-white overflow-hidden flex items-center justify-center text-2xl">
          {file ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
          ) : (
            "📷"
          )}
        </span>
        <span className="text-sm font-bold text-navy">{file ? file.name : "Take or choose a photo"}</span>
        <input type="file" accept="image/*" capture={capture} className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
      </label>
    </Field>
  );

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-5">
        {picker("Selfie", "Face the camera with your eyes open, in good light.", selfie, setSelfie, "user")}
        {picker("Photo ID", "Passport, driving licence or BRP — all corners visible.", photoId, setPhotoId, "environment")}
        <Button type="submit" loading={busy} className="w-full">Submit for verification</Button>
      </form>
    </Card>
  );
}
