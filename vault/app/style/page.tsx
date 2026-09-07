import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

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

      <Section
        index="08"
        title="Buttons"
        note="Variants map to intent, not colour. Gold is the money action and there is at most one per screen — if two things look primary, neither is. Loading keeps the label's box and only hides it, so a button never changes width mid-action."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gold">Release payout</Button>
          <Button variant="ghost">Request revision</Button>
          <Button variant="quiet">Cancel</Button>
          <Button variant="danger">Refund $5,000.00</Button>
          <Button variant="gold" loading>
            Release payout
          </Button>
          <Button variant="ghost" disabled>
            Not your turn
          </Button>
          <Button variant="quiet" size="sm">
            Small
          </Button>
        </div>
      </Section>

      <Section index="09" title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold">◆ In escrow</Badge>
          <Badge tone="positive">Payouts enabled</Badge>
          <Badge tone="warning">Awaiting approval</Badge>
          <Badge tone="negative">Refunded</Badge>
          <Badge tone="info">Revision requested</Badge>
          <Badge tone="muted">Draft</Badge>
        </div>
      </Section>

      <Section
        index="10"
        title="Cards"
        note="tone=&quot;money&quot; puts a card on the emerald surface with a gold hairline. Reserved for balances, escrow and contract value, so the surface itself says what kind of information this is."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Default surface</CardTitle>
              <CardDescription>Lists, forms, settings — everything that isn&apos;t money.</CardDescription>
            </CardHeader>
            <CardBody className="pt-2">
              <p className="text-bone-2 text-sm">Neutral panel on the standard surface.</p>
            </CardBody>
          </Card>
          <Card tone="money">
            <CardHeader>
              <CardTitle>Money surface</CardTitle>
              <CardDescription>Balances, escrow, contract value.</CardDescription>
            </CardHeader>
            <CardBody className="pt-2">
              <p className="font-display text-3xl">
                $48,250<span className="text-gold">.00</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section
        index="11"
        title="Fields"
        note="Labels are always visible. Placeholder-as-label loses the question the moment someone types, which is worst exactly where it matters most. Errors sit under their own field, wired with aria-describedby and role=alert."
      >
        <div className="grid max-w-xl gap-4">
          <Field label="Campaign title" htmlFor="demo-title" required>
            <Input id="demo-title" placeholder="Spring reel campaign" />
          </Field>
          <Field
            label="Proof link"
            htmlFor="demo-link"
            hint="A public URL to the published asset."
          >
            <Input id="demo-link" placeholder="https://" />
          </Field>
          <Field
            label="Amount"
            htmlFor="demo-amount"
            error="Amount must be at least $1.00."
          >
            <Input id="demo-amount" aria-invalid defaultValue="0" className="tnum" />
          </Field>
          <Field label="Note to the brand" htmlFor="demo-note">
            <Textarea id="demo-note" placeholder="Anything they should know…" />
          </Field>
        </div>
      </Section>

      <Section
        index="12"
        title="Ledger table"
        note="The table wraps itself in its own scroll container, so a wide ledger scrolls inside its card and the page body never scrolls sideways."
      >
        <Table>
          <THead>
            <TR className="border-t-0">
              <TH>Description</TH>
              <TH>Type</TH>
              <TH className="text-right">Amount</TH>
              <TH className="text-right">Date</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>Payout · Nord Coffee spring reel</TD>
              <TD>
                <Badge tone="positive">PAYOUT</Badge>
              </TD>
              <TD className="tnum text-positive text-right">+9,000.00</TD>
              <TD className="tnum text-muted text-right">Sep 04</TD>
            </TR>
            <TR>
              <TD>Escrow funded · Atlas Running UGC</TD>
              <TD>
                <Badge tone="gold">EARNING</Badge>
              </TD>
              <TD className="tnum text-right">+5,400.00</TD>
              <TD className="tnum text-muted text-right">Sep 02</TD>
            </TR>
            <TR>
              <TD>Escrow reversed · Lumen skincare</TD>
              <TD>
                <Badge tone="muted">REFUND</Badge>
              </TD>
              <TD className="tnum text-negative text-right">−2,700.00</TD>
              <TD className="tnum text-muted text-right">Aug 28</TD>
            </TR>
          </TBody>
        </Table>
      </Section>

      <Section
        index="13"
        title="States"
        note="This app has no fixtures. When a collection is empty the person genuinely has nothing there, so the screen owes them an explanation and a next step. Errors show the server's own message — it is almost always more useful than anything invented here."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            icon={Inbox}
            title="No contracts yet"
            description="Contracts appear here once you accept an offer. Start from a negotiation."
            action={<Button variant="ghost" size="sm">Go to negotiations</Button>}
          />
          <ErrorState
            error={new Error("Contract is APPROVED and cannot be refunded")}
          />
        </div>
        <div className="mt-4">
          <p className="text-faint mb-2 text-[10px] tracking-wider uppercase">
            Skeletons mirror the shape they replace
          </p>
          <Card>
            <CardBody className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-3 w-36" />
            </CardBody>
          </Card>
        </div>
      </Section>
    </main>
  );
}
