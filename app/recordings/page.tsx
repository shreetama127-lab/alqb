"use client";

import Link from "next/link";

type Session = { title: string; topics: string[] };

const ALEVEL_SESSIONS: Session[] = [
  { title: "Biological Molecules & Cell Biology Foundations", topics: ["Biological molecules (carbohydrates, lipids, proteins, nucleic acids)", "Water and inorganic ions", "Enzymes and factors affecting enzyme activity", "Cell structure (prokaryotic vs eukaryotic)", "Microscopy and magnification", "Cell fractionation and organelles"] },
  { title: "Membranes, Transport & Exchange", topics: ["Cell membranes and the fluid mosaic model", "Diffusion, facilitated diffusion, osmosis and active transport", "Surface area to volume ratio", "Gas exchange surfaces", "Transport adaptations in organisms", "Exchange surfaces in plants and animals"] },
  { title: "DNA, Genetics & Cell Division", topics: ["DNA structure and replication", "Protein synthesis (transcription and translation)", "Genetic code and mutations", "Mitosis and meiosis", "Cell cycle and cancer", "Genetic diversity and variation"] },
  { title: "Biodiversity, Classification & Evolution", topics: ["Biodiversity and classification systems", "Taxonomy and phylogenetic relationships", "Species concepts", "Natural selection and evolution", "Adaptation and selection pressures", "Investigating biodiversity and sampling techniques"] },
  { title: "Physiology — Transport Systems in Animals & Plants", topics: ["Mass transport in animals", "Heart structure and the cardiac cycle", "Blood vessels and circulation", "Haemoglobin and oxygen transport", "Plant transport systems (xylem and phloem)", "Transpiration and translocation"] },
  { title: "Homeostasis, Communication & Coordination", topics: ["Nervous system structure and transmission", "Synapses and reflex arcs", "Hormonal communication", "The endocrine system", "Homeostasis and negative feedback", "Temperature, blood glucose and water regulation"] },
  { title: "Photosynthesis, Respiration & Metabolism", topics: ["Photosynthesis (light-dependent and light-independent reactions)", "Limiting factors affecting photosynthesis", "Respiration pathways (glycolysis, link reaction, Krebs cycle, oxidative phosphorylation)", "ATP production", "Anaerobic respiration", "Energy transfer in organisms"] },
  { title: "Ecology, Populations, Biotechnology & Exam Mastery", topics: ["Ecosystems and energy transfer", "Nutrient cycles", "Population dynamics", "Conservation and sustainability", "Genetic engineering and biotechnology", "Required practicals overview", "Data analysis, experimental design and exam technique"] },
];

const IB_SESSIONS: Session[] = [
  { title: "Cell Biology & Biological Molecules", topics: ["Cell theory", "Prokaryotic and eukaryotic cells", "Organelles and microscopy", "Membrane structure and transport", "Biological molecules", "Enzymes"] },
  { title: "Molecular Biology & Genetics", topics: ["DNA structure and replication", "RNA and protein synthesis", "Gene expression", "Mutations", "Biotechnology and genetic modification", "PCR and gel electrophoresis"] },
  { title: "Metabolism, Respiration & Photosynthesis", topics: ["Metabolic pathways", "Enzymes and energy transfer", "Cellular respiration", "Photosynthesis", "Electron transport chains", "ATP production"] },
  { title: "Plant Biology & Ecology", topics: ["Plant structure and transport", "Water movement and transpiration", "Mineral nutrition", "Ecosystems", "Energy flow", "Population ecology and biodiversity"] },
  { title: "Human Physiology I — Digestion, Transport & Immunity", topics: ["The digestive system", "Nutrient absorption", "Blood and circulation", "Heart function", "Gas exchange", "The immune system"] },
  { title: "Human Physiology II — Coordination & Homeostasis", topics: ["The nervous system", "Neurons and synapses", "Hormonal regulation", "Homeostasis", "Kidney function and osmoregulation", "Reproduction"] },
  { title: "Evolution, Genetics & Animal Biology", topics: ["Natural selection", "Evolutionary relationships", "Speciation", "Population genetics", "Animal behaviour", "Diversity of organisms"] },
  { title: "Experimental Biology, Data Skills & Exam Preparation", topics: ["Experimental design", "Variables and controls", "Statistical analysis", "Data processing and evaluation", "Practical skills", "Internal Assessment guidance", "Exam technique and question practice"] },
];

function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      {sessions.map((s, i) => (
        <div key={i} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">{i + 1}</span>
            <h3 className="text-lg font-extrabold text-zinc-900">{s.title}</h3>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5 pl-1">
            {s.topics.map((t, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-zinc-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function RecordingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
      <div className="text-center">
        <p className="text-5xl">🎥</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900">Tutorial Recordings</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
          Recordings of our masterclass series — 8 weekly sessions covering the whole course, taught by experienced tutors.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
        <p className="text-2xl">⏳</p>
        <p className="mt-2 font-extrabold text-emerald-800">Coming soon</p>
        <p className="mt-1 text-sm text-zinc-600">Recordings will appear here after each masterclass. Here&apos;s what the series covers:</p>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <h2 className="text-2xl font-extrabold text-zinc-900">A-Level Biology series</h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-zinc-500">8 sessions · 40 minutes each</p>
        <SessionList sessions={ALEVEL_SESSIONS} />
      </div>

      <div className="mt-14">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <h2 className="text-2xl font-extrabold text-zinc-900">IB Biology series</h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-zinc-500">8 sessions · 40 minutes each</p>
        <SessionList sessions={IB_SESSIONS} />
      </div>

      <div className="mt-12 flex justify-center">
        <Link href="/dashboard" className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">← Back to dashboard</Link>
      </div>
    </main>
  );
}