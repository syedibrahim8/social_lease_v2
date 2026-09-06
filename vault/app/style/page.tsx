import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design system" };

const SURFACES = [
  { name: "ink", value: "#080B0A", note: "page ground" },
  { name: "ink-2", value: "#0A0F0D", note: "raised ground" },
  { name: "surface", value: "#101917", note: "cards, panels" },
  { name: "surface-2", value: "#14201D", note: "nested panels" },
  { name: "emerald-deep", value: "#123028", note: "money surfaces" },
  { name: "emerald-lo", value: "#0E211C", note: "money surfaces, quiet" },
];

const INK = [
  { name: "bone", value: "#EDE9DF", note: "primary text", ratio: "16.30" },
  { name: "bone-2", value: "#B9C0BB", note: "secondary text", ratio: "10.65" },
  { name: "muted", value: "#8A9690", note: "tertiary text — AA floor", ratio: "6.44" },
  { name: "faint", value: "#5C6762", note: "NON-TEXT ONLY", ratio: "3.36" },
];

const ACCENT = [
  { name: "gold", value: "#C9A227", note: "money + primary action", ratio: "8.17" },
  { name: "gold-lo", value: "#D9B84A", note: "gold text on dark", ratio: "10.26" },
  { name: "gold-hi", value: "#F0D67A", note: "highlights", ratio: "13.74" },
  { name: "positive", value: "#4ADE80", note: "credits, complete", ratio: "11.34" },
  { name: "negative", value: "#F87171", note: "debits, failure", ratio: "7.14" },
  { name: "warning", value: "#E0A33E", note: "pending, attention", ratio: "8.92" },
  { name: "info", value: "#6BA8C9", note: "neutral notice", ratio: "7.59" },
];

function Section({
  index,
  title,
  children,
  note,
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line-2 border-b py-10 last:border-b-0">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-gold text-[10px] font-semibold tracking-[0.2em] uppercase">
          {index}
        </span>
        <h2 className="font-display text-bone text-lg">{title}</h2>
        <span className="from-line h-px flex-1 bg-gradient-to-r to-transparent" />
      </div>
      {note ? <p className="text-muted mb-5 max-w-[70ch] text-xs leading-relaxed">{note}</p> : null}
      {children}
    </section>
  );
}

export default function StylePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header className="mb-4">
        <p className="text-gold text-[10px] font-semibold tracking-[0.2em] uppercase">
          Vault
        </p>
        <h1 className="font-display mt-3 text-4xl">
          The system, <em className="text-gold italic">measured.</em>
        </h1>
        <p className="text-bone-2 mt-3 max-w-[62ch] text-sm leading-relaxed">
          Every value here was checked against every surface with a WCAG contrast script
          before it was committed. The neutral ramp is defined by what passes, not by what
          looked right.
        </p>
      </header>

      <Section
        index="01"
        title="Surfaces"
        note="Darkest to lightest. Emerald surfaces are reserved for money — a balance card, an escrow panel — so the palette itself signals what a region is about."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SURFACES.map((s) => (
            <div key={s.name} className="border-line-2 overflow-hidden rounded-lg border">
              <div className="h-16" style={{ background: s.value }} />
              <div className="bg-surface px-3 py-2">
                <p className="tnum text-bone text-[11px]">{s.name}</p>
                <p className="text-faint mt-0.5 text-[10px]">{s.value}</p>
                <p className="text-muted mt-1 text-[10px]">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        index="02"
        title="Text ramp"
        note="Ratios are against ink, the darkest ground. `faint` fails AA on every surface — that is deliberate, and it is not a text colour. Hairlines, inactive tracker dots, disabled glyph fills only."
      >
        <div className="space-y-2">
          {INK.map((c) => (
            <div
              key={c.name}
              className="border-line-2 flex items-baseline gap-4 rounded-lg border px-4 py-3"
            >
              <span className="tnum w-20 shrink-0 text-[11px]" style={{ color: c.value }}>
                {c.name}
              </span>
              <span className="flex-1 text-sm" style={{ color: c.value }}>
                The escrow released and the balance settled.
              </span>
              <span className="tnum text-muted shrink-0 text-[11px]">{c.ratio}:1</span>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                  c.name === "faint"
                    ? "bg-negative/10 text-negative"
                    : "bg-positive/10 text-positive"
                }`}
              >
                {c.name === "faint" ? "non-text" : "AA"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        index="03"
        title="Accent & semantic"
        note="Gold is rationed: it marks money and the single primary action on a screen. Semantic colours always ship with an icon or a word — red/green alone is exactly what a deuteranope cannot separate."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACCENT.map((c) => (
            <div key={c.name} className="border-line-2 rounded-lg border p-3">
              <div className="mb-2 h-9 rounded-md" style={{ background: c.value }} />
              <p className="tnum text-[11px]" style={{ color: c.value }}>
                {c.name}
              </p>
              <p className="text-faint mt-0.5 text-[10px]">{c.value}</p>
              <p className="text-muted mt-1 text-[10px] leading-snug">{c.note}</p>
              <p className="tnum text-muted mt-1 text-[10px]">{c.ratio}:1</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        index="04"
        title="Three voices"
        note="Serif for the amount you feel. Mono for the figure you compare. Inter for everything you operate. Never two voices in one context."
      >
        <div className="space-y-5">
          <div className="border-line-2 flex items-baseline gap-6 border-b pb-4">
            <span className="tnum text-faint w-40 shrink-0 text-[10px] tracking-wider">
              Playfair · display
            </span>
            <span className="font-display text-3xl">Escrow released</span>
          </div>
          <div className="border-line-2 flex items-baseline gap-6 border-b pb-4">
            <span className="tnum text-faint w-40 shrink-0 text-[10px] tracking-wider">
              Playfair · money
            </span>
            <span className="font-display text-3xl">
              $48,250<span className="text-gold">.00</span>
            </span>
          </div>
          <div className="border-line-2 flex items-baseline gap-6 border-b pb-4">
            <span className="tnum text-faint w-40 shrink-0 text-[10px] tracking-wider">
              JetBrains · figures
            </span>
            <span className="tnum text-bone text-base">
              1,240,500 · 12.4% · +9,000.00 · −2,700.00
            </span>
          </div>
          <div className="flex items-baseline gap-6">
            <span className="tnum text-faint w-40 shrink-0 text-[10px] tracking-wider">
              Inter · interface
            </span>
            <span className="text-bone-2 text-sm">
              Body copy, labels, navigation and form fields.
            </span>
          </div>
        </div>
      </Section>

      <Section
        index="05"
        title="Tabular proof"
        note="Both rows hold the same figures. The mono row keeps its columns as digits change; the proportional row does not. This is why every ledger figure uses .tnum."
      >
        <div className="border-line-2 space-y-1 rounded-lg border p-4">
          <p className="tnum text-positive text-sm">+9,000.00</p>
          <p className="tnum text-negative text-sm">−2,711.11</p>
          <p className="tnum text-bone text-sm">+5,400.00</p>
          <p className="text-faint mt-3 mb-1 text-[10px] tracking-wider uppercase">
            without .tnum — note the drift
          </p>
          <p className="text-positive text-sm">+9,000.00</p>
          <p className="text-negative text-sm">−2,711.11</p>
          <p className="text-bone text-sm">+5,400.00</p>
        </div>
      </Section>

      <Section index="06" title="Radii & elevation">
        <div className="flex flex-wrap items-end gap-4">
          {(["sm", "md", "lg", "xl", "2xl"] as const).map((r) => (
            <div key={r} className="text-center">
              <div
                className="bg-surface-2 border-line-2 size-16 border"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <p className="tnum text-muted mt-2 text-[10px]">{r}</p>
            </div>
          ))}
          <div className="text-center">
            <div className="bg-emerald-deep border-line size-16 rounded-xl border shadow-[var(--shadow-gold)]" />
            <p className="tnum text-muted mt-2 text-[10px]">gold</p>
          </div>
          <div className="text-center">
            <div className="bg-surface-2 border-line-2 size-16 rounded-xl border shadow-[var(--shadow-lift)]" />
            <p className="tnum text-muted mt-2 text-[10px]">lift</p>
          </div>
        </div>
      </Section>

      <Section
        index="07"
        title="Focus & sheen"
        note="Tab into the button below. Focus is 2px gold at 2px offset — 8.17:1 on ink, comfortably past the 3:1 the WCAG 2.2 focus-appearance criterion asks for. The sheen runs once every 3.4s and stops entirely under reduced motion."
      >
        <button
          type="button"
          className="sheen from-gold-lo rounded-lg bg-gradient-to-b to-[#B8901D] px-5 py-2.5 text-[13px] font-semibold text-[#15100A] shadow-[var(--shadow-gold)]"
        >
          Release payout
        </button>
      </Section>
    </main>
  );
}
