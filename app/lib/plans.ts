export type Plan = {
  id: string;
  qualification: "A-Level" | "IB";
  subject: string;
  variant: string;
  title: string;
  emoji: string;
  price: string;
  period: string;
  live: boolean;
};

export const PLANS: Plan[] = [
  { id: "ocr-biology", qualification: "A-Level", subject: "Biology", variant: "OCR", title: "OCR A-Level Biology", emoji: "🧬", price: "£40", period: "per year", live: true },
  { id: "aqa-biology", qualification: "A-Level", subject: "Biology", variant: "AQA", title: "AQA A-Level Biology", emoji: "🌿", price: "£40", period: "per year", live: false },
  { id: "ocr-chemistry", qualification: "A-Level", subject: "Chemistry", variant: "OCR", title: "OCR A-Level Chemistry", emoji: "🧪", price: "£40", period: "per year", live: false },
  { id: "aqa-chemistry", qualification: "A-Level", subject: "Chemistry", variant: "AQA", title: "AQA A-Level Chemistry", emoji: "⚗️", price: "£40", period: "per year", live: false },
  { id: "ib-biology-sl", qualification: "IB", subject: "Biology", variant: "Standard Level", title: "IB Biology (SL)", emoji: "🌍", price: "£40", period: "per year", live: false },
  { id: "ib-biology-hl", qualification: "IB", subject: "Biology", variant: "Higher Level", title: "IB Biology (HL)", emoji: "🌏", price: "£40", period: "per year", live: false },
];

export const FREE_PLAN_IDS = ["ocr-biology"];

export const MODULE_TITLES: Record<string, string> = {
  M2: "Module 2 — Foundations in Biology",
  M3: "Module 3 — Exchange and Transport",
  M4: "Module 4 — Biodiversity, Evolution and Disease",
  M5: "Module 5 — Communication, Homeostasis and Energy",
  M6: "Module 6 — Genetics, Evolution and Ecosystems",
};