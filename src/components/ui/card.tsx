"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glass?: boolean;
    elevate?: boolean;
  }
>(({ className, glass = true, elevate = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[1.5rem] text-card-foreground",
      glass ? "glass" : "bg-card border border-border shadow-[var(--shadow-soft)]",
      elevate && "hover-lift",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 pb-3 sm:p-6 sm:pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-base font-semibold tracking-tight sm:text-lg", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-2 sm:p-6 sm:pt-3", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0 sm:p-6", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export function MotionCard({
  children,
  className,
  delay = 0,
  elevate = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  elevate?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass rounded-[1.5rem] text-card-foreground",
        elevate && "hover-lift",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
