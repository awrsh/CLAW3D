"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createInitialSimulationState,
  PRODUCTION_STAGES,
  STAGE_LABELS,
  type FactoryAreaId,
  type FactorySimulationState,
  type ProductionStage,
} from "@/components/factory/simulation/ProductionState";
import {
  FACTORY_AREA_MAP,
  GUIDED_TOUR_ORDER,
  type CameraViewMode,
} from "@/components/factory/simulation/factoryLayout";
import { stageToArea } from "@/components/factory/simulation/ProductionState";

const STAGE_DURATION_MS = 3200;

type FactoryContextValue = {
  state: FactorySimulationState;
  startProduction: () => void;
  stopProduction: () => void;
  selectArea: (id: FactoryAreaId | null) => void;
  selectEquipment: (id: string | null) => void;
  startGuidedTour: () => void;
  stopGuidedTour: () => void;
  advanceGuidedTour: () => void;
  setIntroComplete: (value: boolean) => void;
  flyToArea: (id: FactoryAreaId) => void;
  onFlyToArea?: (id: FactoryAreaId) => void;
  registerFlyHandler: (handler: (id: FactoryAreaId, mode?: CameraViewMode) => void) => void;
};

const FactoryContext = createContext<FactoryContextValue | null>(null);

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FactorySimulationState>(
    createInitialSimulationState,
  );
  const flyHandlerRef = useRef<((id: FactoryAreaId, mode?: CameraViewMode) => void) | null>(null);
  const simTimerRef = useRef<number | null>(null);

  const registerFlyHandler = useCallback((handler: (id: FactoryAreaId, mode?: CameraViewMode) => void) => {
    flyHandlerRef.current = handler;
  }, []);

  const flyToArea = useCallback((id: FactoryAreaId, mode?: CameraViewMode) => {
    flyHandlerRef.current?.(id, mode);
    setState((s) => ({ ...s, selectedAreaId: id }));
  }, []);

  const selectArea = useCallback((id: FactoryAreaId | null) => {
    setState((s) => ({
      ...s,
      selectedAreaId: id,
      selectedEquipmentId: null,
    }));
    if (id) flyHandlerRef.current?.(id, "cinematic");
  }, []);

  const selectEquipment = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedEquipmentId: id }));
  }, []);

  const stopProduction = useCallback(() => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    simTimerRef.current = null;
    setState((s) => ({
      ...s,
      isSimulating: false,
      productionStage: "idle",
      overallProgress: 0,
      activeAreaId: null,
    }));
  }, []);

  const startProduction = useCallback(() => {
    stopProduction();
    setState((s) => ({
      ...s,
      isSimulating: true,
      productionStage: PRODUCTION_STAGES[0],
      overallProgress: 5,
      activeAreaId: stageToArea(PRODUCTION_STAGES[0]),
    }));
    flyHandlerRef.current?.(stageToArea(PRODUCTION_STAGES[0])!, "overview");

    let index = 0;
    simTimerRef.current = window.setInterval(() => {
      index += 1;
      if (index >= PRODUCTION_STAGES.length) {
        if (simTimerRef.current) window.clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        setState((s) => ({
          ...s,
          isSimulating: false,
          productionStage: "finished",
          overallProgress: 100,
          activeAreaId: "finished-goods",
        }));
        flyHandlerRef.current?.("finished-goods", "overview");
        return;
      }
      const stage = PRODUCTION_STAGES[index];
      const area = stageToArea(stage);
      setState((s) => ({
        ...s,
        productionStage: stage,
        overallProgress: Math.round(((index + 1) / PRODUCTION_STAGES.length) * 100),
        activeAreaId: area,
      }));
      if (area) flyHandlerRef.current?.(area, "overview");
    }, STAGE_DURATION_MS);
  }, [stopProduction]);

  const startGuidedTour = useCallback(() => {
    stopProduction();
    setState((s) => ({
      ...s,
      guidedTourActive: true,
      guidedTourIndex: 0,
      selectedAreaId: GUIDED_TOUR_ORDER[0],
    }));
    flyHandlerRef.current?.(GUIDED_TOUR_ORDER[0], "cinematic");
  }, [stopProduction]);

  const stopGuidedTour = useCallback(() => {
    setState((s) => ({
      ...s,
      guidedTourActive: false,
      guidedTourIndex: 0,
    }));
  }, []);

  const advanceGuidedTour = useCallback(() => {
    setState((s) => {
      const next = s.guidedTourIndex + 1;
      if (next >= GUIDED_TOUR_ORDER.length) {
        return { ...s, guidedTourActive: false, guidedTourIndex: 0 };
      }
      const id = GUIDED_TOUR_ORDER[next];
      flyHandlerRef.current?.(id, "cinematic");
      return {
        ...s,
        guidedTourIndex: next,
        selectedAreaId: id,
      };
    });
  }, []);

  const setIntroComplete = useCallback((value: boolean) => {
    setState((s) => ({ ...s, introComplete: value }));
  }, []);

  useEffect(() => () => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
  }, []);

  useEffect(() => {
    if (!state.guidedTourActive) return;
    const timer = window.setInterval(advanceGuidedTour, 5500);
    return () => window.clearInterval(timer);
  }, [state.guidedTourActive, advanceGuidedTour]);

  const value = useMemo(
    () => ({
      state,
      startProduction,
      stopProduction,
      selectArea,
      selectEquipment,
      startGuidedTour,
      stopGuidedTour,
      advanceGuidedTour,
      setIntroComplete,
      flyToArea,
      registerFlyHandler,
    }),
    [
      state,
      startProduction,
      stopProduction,
      selectArea,
      selectEquipment,
      startGuidedTour,
      stopGuidedTour,
      advanceGuidedTour,
      setIntroComplete,
      flyToArea,
      registerFlyHandler,
    ],
  );

  return (
    <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>
  );
}

export function useFactory() {
  const ctx = useContext(FactoryContext);
  if (!ctx) throw new Error("useFactory must be used within FactoryProvider");
  return ctx;
}

export function useFactoryArea(id: FactoryAreaId) {
  return FACTORY_AREA_MAP[id];
}

export { STAGE_LABELS };
