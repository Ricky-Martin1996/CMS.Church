"use client";

/**
 * Decorative aurora — CSS-only, fewer blobs, respects reduced motion via globals.
 * Kept as a client module only so it can be dynamically imported from AppShell.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="aurora-blob left-[-12%] top-[-14%] h-[50vh] w-[50vw] motion-reduce:animate-none"
        style={{ background: "hsl(var(--aurora-1))" }}
      />
      <div
        className="aurora-blob right-[-18%] top-[8%] h-[44vh] w-[42vw] motion-reduce:animate-none"
        style={{ background: "hsl(var(--aurora-2))" }}
      />
      <div
        className="aurora-blob bottom-[-18%] left-[20%] h-[40vh] w-[46vw] motion-reduce:animate-none"
        style={{ background: "hsl(var(--aurora-3))" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background)/0.55)_70%)]" />
      <div className="absolute inset-0 bg-background/30 dark:bg-background/50" />
    </div>
  );
}
