"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@react-three/drei";

type LaboratoryLoaderProps = {
  visible: boolean;
};

export function LaboratoryLoaderOverlay({ visible }: LaboratoryLoaderProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#eef2f6]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Loading Laboratory...
          </div>
          <div className="mt-4 h-0.5 w-48 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full origin-left rounded-full bg-teal-600/80"
              initial={{ scaleX: 0.15 }}
              animate={{ scaleX: 0.85 }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Reads R3F asset progress — must be rendered inside Canvas. */
export function LaboratoryProgressReporter({
  onProgress,
}: {
  onProgress: (value: number) => void;
}) {
  const { progress } = useProgress();
  if (progress >= 100) onProgress(100);
  else onProgress(progress);
  return null;
}
