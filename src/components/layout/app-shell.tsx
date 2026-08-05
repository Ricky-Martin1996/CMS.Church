"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuroraBackground } from "@/components/motion/aurora-background";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command/command-palette";
import { PageTransition } from "@/components/motion/page-transition";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 sm:p-4 lg:p-5">
        <div className="hidden lg:sticky lg:top-5 lg:block lg:h-[calc(100vh-2.5rem)]">
          <Sidebar />
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close navigation overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="fixed left-3 top-3 bottom-3 z-50 lg:hidden"
              >
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            onCommandOpen={() => setCommandOpen(true)}
          />
          <main id="main" className="min-w-0 flex-1 pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
