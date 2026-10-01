export type PriceOption = {
  id: string;
  label: string;
  price: string;
};

export type Plan = {
  id: string;
  qualification: "A-Level" | "IB";
  subject: string;
  variant: string;
  title: string;
  emoji: string;
  live: boolean;
};

export const PRICE_OPTIONS: PriceOption[] = [
  { id: "1month", label: "1 month", price: "£20" },
  { id: "6months", label: "6 months", price: "£35" },
  { id: "1year", label: "1 year", price: "£50" },
  { id: "exam", label: "Until my exam", price: "£80" },
];

export const PLANS: Plan[] = [
  { id: "ocr-biology", qualification: "A-Level", subject: "Biology", variant: "OCR", title: "OCR A-Level Biology", emoji: "🧬", live: true },
  { id: "aqa-biology", qualification: "A-Level", subject: "Biology", variant: "AQA", title: "AQA A-Level Biology", emoji: "🌿", live: true },
  { id: "ocr-chemistry", qualification: "A-Level", subject: "Chemistry", variant: "OCR", title: "OCR A-Level Chemistry", emoji: "🧪", live: false },
  { id: "aqa-chemistry", qualification: "A-Level", subject: "Chemistry", variant: "AQA", title: "AQA A-Level Chemistry", emoji: "⚗️", live: false },
  { id: "ib-biology-sl", qualification: "IB", subject: "Biology", variant: "Standard Level", title: "IB Biology (SL)", emoji: "🌍", live: false },
  { id: "ib-biology-hl", qualification: "IB", subject: "Biology", variant: "Higher Level", title: "IB Biology (HL)", emoji: "🌏", live: false },
  { id: "tutorial-recordings", qualification: "A-Level", subject: "Tutorials", variant: "Recordings", title: "Tutorial Recordings", emoji: "🎥", live: true },
];

export const FREE_PLAN_IDS = ["ocr-biology", "tutorial-recordings"];

// Kept for backwards compatibility (OCR default)
export const MODULE_TITLES: Record<string, string> = {
  M2: "Module 2 — Foundations in Biology",
  M3: "Module 3 — Exchange and Transport",
  M4: "Module 4 — Biodiversity, Evolution and Disease",
  M5: "Module 5 — Communication, Homeostasis and Energy",
  M6: "Module 6 — Genetics, Evolution and Ecosystems",
};

// Real module/topic names per exam board
export const MODULE_TITLES_BY_BOARD: Record<string, Record<string, string>> = {
  OCR: {
    M1: "Module 1 — Development of practical skills in biology",
    M2: "Module 2 — Foundations in biology",
    M3: "Module 3 — Exchange and transport",
    M4: "Module 4 — Biodiversity, evolution and disease",
    M5: "Module 5 — Communication, homeostasis and energy",
    M6: "Module 6 — Genetics, evolution and ecosystems",
  },
  AQA: {
    M1: "Topic 1 — Biological molecules",
    M2: "Topic 2 — Cells",
    M3: "Topic 3 — Organisms exchange substances with their environment",
    M4: "Topic 4 — Genetic information, variation and relationships between organisms",
    M5: "Topic 5 — Energy transfers in and between organisms",
    M6: "Topic 6 — Organisms respond to changes in their environments",
    M7: "Topic 7 — Genetics, populations, evolution and ecosystems",
    M8: "Topic 8 — The control of gene expression",
  },
};

export function moduleTitle(board: string | null | undefined, moduleCode: string): string {
  const b = (board || "OCR").toUpperCase();
  return MODULE_TITLES_BY_BOARD[b]?.[moduleCode] || MODULE_TITLES[moduleCode] || moduleCode;
}