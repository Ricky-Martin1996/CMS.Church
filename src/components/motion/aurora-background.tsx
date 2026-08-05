"use client";

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="aurora-blob left-[-12%] top-[-14%] h-[58vh] w-[58vw]"
        style={{ background: "hsl(var(--aurora-1))" }}
      />
      <div
        className="aurora-blob right-[-18%] top-[5%] h-[52vh] w-[48vw]"
        style={{ background: "hsl(var(--aurora-2))" }}
      />
      <div
        className="aurora-blob bottom-[-22%] left-[15%] h-[48vh] w-[52vw]"
        style={{ background: "hsl(var(--aurora-3))" }}
      />
      <div
        className="aurora-blob bottom-[8%] right-[5%] h-[38vh] w-[38vw]"
        style={{ background: "hsl(var(--aurora-4))" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background)/0.55)_70%)]" />
      <div className="absolute inset-0 bg-background/25 dark:bg-background/45" />
    </div>
  );
}
