"use client";

import { useState, type FormEvent } from "react";
import { listOf, navo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Badge, Button, Card, Field, Input, PasswordInput, Select } from "@/components/ui";
import { useToast } from "@/components/toast";

const PIN = /^\d{4}$/;
const pinInput = (value: string, onChange: (v: string) => void) => (
  <Input type="password" inputMode="numeric" maxLength={4} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} className="tracking-[0.6em]" />
);

export default function SecurityPage() {
  const { data: profile, reload } = useApi("/profile");
  const user = profile?.user;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-navy">Security</h1>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <PinCard isPinSet={!!user?.isPinSet} email={user?.email} onChange={reload} />
        <QuestionsCard isSet={!!user?.isQuestionSet} onChange={reload} />
      </div>
    </div>
  );
}

function PinCard({ isPinSet, email, onChange }: { isPinSet: boolean; email?: string; onChange: () => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<"change" | "forgot" | "otp" | "reset">("change");
  const [pins, setPins] = useState({ oldPin: "", newPin: "", confirmNewPin: "" });
  const [password, setPassword] = useState("");
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!PIN.test(pins.newPin) || (isPinSet && mode === "change" && !PIN.test(pins.oldPin))) return toast("PINs are 4 digits", "danger");
    if (pins.newPin !== pins.confirmNewPin) return toast("New PINs do not match", "danger");
    run(async () => {
      if (isPinSet && mode === "change") await navo.patch("/account/change-pin", pins);
      else await navo.post("/account/set-pin", { transactionPin: pins.newPin });
      toast(isPinSet && mode === "change" ? "PIN changed" : "PIN set", "success");
      setPins({ oldPin: "", newPin: "", confirmNewPin: "" });
      setMode("change");
      onChange();
    });
  };

  const startForgot = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await navo.post("/account/forgot-pin", { email, password });
      toast("We've emailed you a code", "success");
      setMode("otp");
    });
  };

  const verifyOtp = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await navo.post("/account/verify-forgot-pin-otp", { email, resetPinOtp: otp.trim() });
      toast("Code accepted. Choose a new PIN.", "success");
      setMode("reset");
    });
  };

  const settingNew = !isPinSet || mode === "reset";

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-navy text-lg">Transaction PIN</h2>
        <Badge tone={isPinSet ? "success" : "warning"}>{isPinSet ? "Set" : "Not set"}</Badge>
      </div>
      {mode === "forgot" ? (
        <form onSubmit={startForgot} className="space-y-4">
          <p className="text-sm text-navy/70">Confirm your password and we&apos;ll email a reset code to {email}.</p>
          <Field label="Password"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Button type="submit" loading={busy} className="w-full">Send code</Button>
          <Button type="button" variant="ghost" onClick={() => setMode("change")} className="w-full">Cancel</Button>
        </form>
      ) : mode === "otp" ? (
        <form onSubmit={verifyOtp} className="space-y-4">
          <Field label="Code from your email"><Input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} /></Field>
          <Button type="submit" loading={busy} className="w-full">Verify code</Button>
          <Button type="button" variant="ghost" onClick={() => navo.post("/account/resend-otp-pin", { email }).then(() => toast("New code sent", "success")).catch((err) => toast(err.message, "danger"))} className="w-full">Resend code</Button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {isPinSet && !settingNew && <Field label="Current PIN">{pinInput(pins.oldPin, (v) => setPins({ ...pins, oldPin: v }))}</Field>}
          <Field label="New PIN">{pinInput(pins.newPin, (v) => setPins({ ...pins, newPin: v }))}</Field>
          <Field label="Confirm new PIN">{pinInput(pins.confirmNewPin, (v) => setPins({ ...pins, confirmNewPin: v }))}</Field>
          <Button type="submit" loading={busy} className="w-full">{settingNew ? "Save PIN" : "Change PIN"}</Button>
          {isPinSet && !settingNew && <Button type="button" variant="ghost" onClick={() => setMode("forgot")} className="w-full">Forgot PIN?</Button>}
        </form>
      )}
    </Card>
  );
}

function QuestionsCard({ isSet, onChange }: { isSet: boolean; onChange: () => void }) {
  const toast = useToast();
  const { data } = useApi("/secure/security-questions");
  const questions = listOf<{ id: string; question: string }>(data);
  const [answers, setAnswers] = useState([{ questionId: "", answer: "" }, { questionId: "", answer: "" }]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (answers.some((a) => !a.questionId || !a.answer.trim())) return toast("Choose two questions and answer both", "danger");
    if (answers[0].questionId === answers[1].questionId) return toast("Choose two different questions", "danger");
    if (isSet && !password) return toast("Enter your password to change your questions", "danger");
    setBusy(true);
    try {
      const clean = answers.map((a) => ({ questionId: a.questionId, answer: a.answer.trim() }));
      if (isSet) await navo.put("/secure/change-security-questions", { password, newQuestions: clean });
      else await navo.post("/secure/set-security-questions", { questions: clean });
      toast("Security questions saved", "success");
      setPassword("");
      onChange();
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-navy text-lg">Security questions</h2>
        <Badge tone={isSet ? "success" : "warning"}>{isSet ? "Set" : "Not set"}</Badge>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {answers.map((a, i) => (
          <div key={i} className="space-y-2">
            <Field label={`Question ${i + 1}`}>
              <Select value={a.questionId} onChange={(e) => setAnswers(answers.map((x, idx) => (idx === i ? { ...x, questionId: e.target.value } : x)))}>
                <option value="">Choose a question</option>
                {questions.map((q) => <option key={q.id} value={q.id}>{q.question}</option>)}
              </Select>
            </Field>
            <Input value={a.answer} onChange={(e) => setAnswers(answers.map((x, idx) => (idx === i ? { ...x, answer: e.target.value } : x)))} placeholder="Your answer" />
          </div>
        ))}
        {isSet && <Field label="Password"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /></Field>}
        <Button type="submit" variant="navy" loading={busy} className="w-full">{isSet ? "Change questions" : "Save questions"}</Button>
      </form>
    </Card>
  );
}
