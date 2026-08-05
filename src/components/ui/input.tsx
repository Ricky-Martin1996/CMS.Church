import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-input/80 bg-background/50 px-4 py-2 text-sm shadow-sm transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/80 hover:border-border hover:bg-background/70 focus-visible:border-ring/50 focus-visible:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
