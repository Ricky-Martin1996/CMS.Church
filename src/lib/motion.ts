/** Shared motion tokens — use only where motion improves UX */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.18,
  base: 0.28,
  slow: 0.4,
} as const;

export const springSoft = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
};

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.base, ease: easeOut },
    },
  },
};
