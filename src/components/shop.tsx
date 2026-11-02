"use client";

import { useCallback, useEffect, useState } from "react";
import { NIGERIA_STATES } from "@/lib/shipping";
import { Field, Input, Select } from "./ui";

/** Delivery address used by every Shop4Me checkout (API ShippingAddressDto). */
export type Address = { state: string; city: string; street: string; houseNo: string; closeLandmark: string; deliveryHub: string };
export const EMPTY_ADDRESS: Address = { state: "", city: "", street: "", houseNo: "", closeLandmark: "", deliveryHub: "Delivery to Hub" };

export function addressProblem(a: Address) {
  if (!a.state) return "Choose your state";
  if (!a.city.trim() || !a.street.trim() || !a.houseNo.trim()) return "Add your house number, street and city";
  if (!a.closeLandmark.trim()) return "Add a nearby landmark";
  return null;
}

export function AddressFields({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  const set = (k: keyof Address) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="State">
          <Select value={value.state} onChange={set("state")}>
            <option value="">Select state</option>
            {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="City"><Input value={value.city} onChange={set("city")} /></Field>
        <Field label="House no."><Input value={value.houseNo} onChange={set("houseNo")} /></Field>
        <Field label="Street"><Input value={value.street} onChange={set("street")} /></Field>
      </div>
      <Field label="Closest landmark"><Input value={value.closeLandmark} onChange={set("closeLandmark")} /></Field>
      <Field label="Delivery">
        <Select value={value.deliveryHub} onChange={set("deliveryHub")}>
          <option value="Delivery to Hub">Pick up at the Navo hub</option>
          <option value="Home Delivery">Deliver to my address</option>
        </Select>
      </Field>
    </div>
  );
}

export type CartLine = { id: string; name: string; price: number; currency: string; image?: string; quantity: number };

/** Small per-store cart kept in localStorage (the API only sees it at checkout). */
export function useCart(key: string) {
  const storageKey = `navo_cart_${key}`;
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      setLines(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      setLines([]);
    }
  }, [storageKey]);

  const save = useCallback(
    (next: CartLine[]) => {
      setLines(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
    },
    [storageKey],
  );

  return {
    lines,
    add: (line: Omit<CartLine, "quantity">, quantity = 1) => {
      const existing = lines.find((l) => l.id === line.id);
      save(existing ? lines.map((l) => (l.id === line.id ? { ...l, quantity: l.quantity + quantity } : l)) : [...lines, { ...line, quantity }]);
    },
    setQuantity: (id: string, quantity: number) => save(quantity <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, quantity } : l))),
    clear: () => save([]),
    total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    count: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

export function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full bg-input">
      <button type="button" onClick={() => onChange(value - 1)} className="size-8 font-bold text-navy" aria-label="Decrease">−</button>
      <span className="w-6 text-center text-sm font-bold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="size-8 font-bold text-navy" aria-label="Increase">+</button>
    </div>
  );
}

/** Amazon/Rapid API prices arrive as "$12.99" or numbers. */
export const toNumber = (v: unknown) => Number(String(v ?? 0).replace(/[^\d.]/g, "")) || 0;
