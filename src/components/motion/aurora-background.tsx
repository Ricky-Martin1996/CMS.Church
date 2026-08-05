"use client";

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="aurora-blob left-[-10%] top-[-10%] h-[55vh] w-[55vw]"
        style={{ background: "hsl(var(--aurora-1))" }}
      />
      <div
        className="aurora-blob right-[-15%] top-[10%] h-[50vh] w-[45vw]"
        style={{ background: "hsl(var(--aurora-2))" }}
      />
      <div
        className="aurora-blob bottom-[-20%] left-[20%] h-[45vh] w-[50vw]"
        style={{ background: "hsl(var(--aurora-3))" }}
      />
      <div
        className="aurora-blob bottom-[10%] right-[10%] h-[35vh] w-[35vw]"
        style={{ background: "hsl(var(--aurora-4))" }}
      />
      <div className="absolute inset-0 bg-background/40 dark:bg-background/55" />
    </div>
  );
}
