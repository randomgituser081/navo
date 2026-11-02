const SYMBOLS: Record<string, string> = { NGN: "₦", GBP: "£", USD: "$", EUR: "€" };

export function money(amount: number | string | null | undefined, currency = "NGN") {
  const cur = (currency || "NGN").toUpperCase();
  const n = Number(amount ?? 0);
  const value = Number.isFinite(n) ? n : 0;
  return `${SYMBOLS[cur] ?? `${cur} `}${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "SHOP_FOR_ME" → "Shop For Me" */
export function titleCase(value?: string) {
  return (value ?? "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
