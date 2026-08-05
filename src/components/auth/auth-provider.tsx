"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Clerk session provider. Theme styling is kept light-default so we don't
 * couple auth chrome to next-themes hydration.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(174 48% 34%)",
          borderRadius: "1rem",
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      {children}
    </ClerkProvider>
  );
}
