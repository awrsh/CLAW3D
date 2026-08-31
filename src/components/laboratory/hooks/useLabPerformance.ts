"use client";

import { useEffect, useState } from "react";
import type { LabPerformanceProfile } from "@/components/laboratory/types";

export function useLabPerformance(): LabPerformanceProfile {
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
    dpr: isMobile ? [1, 1.25] : [1, 1.75],
    shadows: !isMobile,
    shadowMapSize: isMobile ? 1024 : 2048,
    antialias: !isMobile,
    enableHeroGlow: !isMobile,
    pipeDetail: isMobile ? "simple" : "full",
  };
}
