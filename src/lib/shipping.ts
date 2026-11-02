// Mirrors navo_app_frontend/constants/data.ts and the API's EGoodsType / EShipmentStatus.

export const COUNTRIES = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "UK", label: "United Kingdom" },
];

export const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const UK_LOCATIONS = ["England", "Scotland", "Wales", "Northern Ireland"];

export const regionsFor = (country: string) => (country === "Nigeria" ? NIGERIA_STATES : country === "UK" ? UK_LOCATIONS : []);

export const GOODS_TYPES = [
  { value: "general", label: "General" },
  { value: "foodstuffs", label: "Foodstuffs" },
  { value: "clothes", label: "Clothes" },
  { value: "sensitive", label: "Sensitive items" },
  { value: "extra_luggage", label: "Extra luggage" },
  { value: "others", label: "Others" },
];

/** Customer-facing journey, in order; other statuses are shown as a badge only. */
export const SHIPMENT_STEPS = [
  { key: "pending", label: "Lodged" },
  { key: "processing", label: "Processing" },
  { key: "checked_in", label: "Checked in" },
  { key: "in_transit", label: "In transit" },
  { key: "arrived", label: "Arrived at hub" },
  { key: "completed", label: "Delivered" },
];

export function stepIndex(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s.startsWith("arrived")) return 4;
  if (s === "shipped" || s === "packed" || s === "checked_out") return 3;
  const i = SHIPMENT_STEPS.findIndex((step) => step.key === s);
  return i === -1 ? 0 : i;
}
