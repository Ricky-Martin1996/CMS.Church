"use client";

import { accents, useAccent, type AccentId } from "@/lib/accent";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AccentPicker() {
  const { accent, setAccent } = useAccent();

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="flex items-center gap-1.5 rounded-2xl border border-border/60 bg-background/40 p-1"
        role="group"
        aria-label="Accent color"
      >
        {accents.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${item.label} accent`}
                aria-pressed={accent === item.id}
                onClick={() => setAccent(item.id as AccentId)}
                className={cn(
                  "relative h-6 w-6 rounded-full transition-transform hover:scale-110",
                  accent === item.id && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                )}
                style={{ background: item.swatch }}
              />
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
