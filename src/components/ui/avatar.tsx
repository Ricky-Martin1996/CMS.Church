"use client";

import * as React from "react";
import Image from "next/image";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

type AvatarImageProps = Omit<
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>,
  "src"
> & {
  src?: string | null;
};

/**
 * Uses next/image for remote https avatars (Clerk CDN, etc.) for AVIF/WebP + sizing.
 * Falls back to Radix img for relative/data URLs.
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, alt = "", ...props }, ref) => {
  const remote =
    typeof src === "string" &&
    (src.startsWith("https://") || src.startsWith("http://"));

  if (remote && src) {
    return (
      <span className={cn("absolute inset-0 block", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover"
          // Allow any https host configured in next.config; otherwise unoptimized.
          unoptimized={!/^https:\/\/(img\.clerk\.com|images\.clerk\.dev|www\.gravatar\.com|images\.unsplash\.com)/.test(src)}
        />
      </span>
    );
  }

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src ?? undefined}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-2xl bg-muted text-sm font-medium",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
