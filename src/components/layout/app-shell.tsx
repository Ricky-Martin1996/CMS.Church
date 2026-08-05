"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuroraBackground } from "@/components/motion/aurora-background";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsPanel } from "@/components/layout/notifications";
import { CommandPalette } from "@/components/command/command-palette";
import { PageTransition } from "@/components/motion/page-transition";
import { useMediaQuery } from "@/hooks/use-media-query";
import { notifications } from "@/lib/data";

const SIDEBAR_KEY = "churchos-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const unread = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-4 p-3 sm:p-4 lg:gap-5 lg:p-5">
        <div className="hidden lg:sticky lg:top-5 lg:block lg:h-[calc(100vh-2.5rem)]">
          <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
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
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="fixed left-3 top-3 bottom-3 z-50 lg:hidden"
              >
                <Sidebar
                  collapsed={false}
                  onToggle={() => setMobileOpen(false)}
                  onNavigate={() => setMobileOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            onCommandOpen={() => setCommandOpen(true)}
            onNotificationsOpen={() => setNotificationsOpen(true)}
            unreadCount={unread}
          />
          <main id="main" className="min-w-0 flex-1 pb-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
