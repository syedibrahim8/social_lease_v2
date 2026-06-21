const brands = ["Northwind", "Lumen", "Vertex", "Hightide", "Monarch", "Cobalt"];

export function Logos() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-muted-foreground text-center text-xs tracking-wide uppercase">
          Trusted by modern brands and creators
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((b) => (
            <span
              key={b}
              className="text-muted-foreground/70 text-lg font-semibold tracking-tight"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
