"use client";

import { useEffect, useState } from "react";

/** Quality scaling only — all scene features stay enabled. */
export type FactoryPerformanceProfile = {
  isMobile: boolean;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
};

export function useFactoryPerformance(): FactoryPerformanceProfile {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return {
    isMobile,
    dpr: isMobile ? [1, 1.15] : [1, 1.5],
    shadows: !isMobile,
    shadowMapSize: isMobile ? 512 : 1024,
    antialias: !isMobile,
  };
}
