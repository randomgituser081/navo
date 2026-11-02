"use client";

import { useState, type FormEvent } from "react";
import { navo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Field, Input, Modal } from "./ui";
import { useToast } from "./toast";

const PIN = /^\d{4}$/;

/**
 * Asks for the 4-digit transaction PIN before a wallet payment. Accounts without a PIN
 * create one first (POST /account/set-pin), then continue with the payment.
 */
export function PinModal({
  open,
  onClose,
  onPin,
  title = "Confirm with your PIN",
}: {
  open: boolean;
  onClose: () => void;
  onPin: (pin: string) => Promise<void>;
  title?: string;
}) {
  const toast = useToast();
  const { data: profile, reload } = useApi(open ? "/profile" : null);
  const needsPin = profile?.user && profile.user.isPinSet === false;
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!PIN.test(pin)) return toast("Your PIN is 4 digits", "danger");
    if (needsPin && pin !== confirm) return toast("PINs do not match", "danger");
    setBusy(true);
    try {
      if (needsPin) {
        await navo.post("/account/set-pin", { transactionPin: pin });
        reload();
      }
      await onPin(pin);
      setPin("");
      setConfirm("");
    } catch (err) {
      toast((err as Error).message, "danger");
    } finally {
      setBusy(false);
    }
  }

  const pinInput = (value: string, onChange: (v: string) => void, label: string) => (
    <Field label={label}>
      <Input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="text-center tracking-[0.8em] text-2xl"
      />
    </Field>
  );

  return (
    <Modal open={open} onClose={onClose} title={needsPin ? "Create a transaction PIN" : title}>
      <form onSubmit={submit} className="space-y-5">
        {needsPin && <p className="text-sm text-navy/70">You need a 4-digit PIN to pay from your wallet. Create one now.</p>}
        {pinInput(pin, setPin, needsPin ? "New PIN" : "PIN")}
        {needsPin && pinInput(confirm, setConfirm, "Confirm PIN")}
        <Button type="submit" loading={busy} className="w-full">{needsPin ? "Create PIN and pay" : "Confirm payment"}</Button>
      </form>
    </Modal>
  );
}
