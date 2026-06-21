import { Reveal } from "./reveal";

const stats = [
  { value: "$4.2M+", label: "Paid out to creators" },
  { value: "1,200+", label: "Verified creators & brands" },
  { value: "98%", label: "On-time payout rate" },
  { value: "10%", label: "Flat platform commission" },
];

export function Stats() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <Reveal className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-[#0B0F19] px-6 py-12 text-white sm:px-10">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
