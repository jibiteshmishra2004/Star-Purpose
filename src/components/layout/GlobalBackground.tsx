/** White base + slow shifting gradient + subtle grid (minimal CPU). */
export function GlobalBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(150 20% 92% / 0.45) 1px, transparent 1px),
            linear-gradient(90deg, hsl(150 20% 92% / 0.45) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />
      <div className="mesh-page-bg absolute inset-0 opacity-[0.85]" />
      <div className="bg-gradient-animated absolute inset-0 opacity-35 mix-blend-multiply" />
    </div>
  );
}
