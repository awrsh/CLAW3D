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
  type SceneViewMode,
} from "@/components/factory/simulation/ProductionState";
import {
  FACTORY_AREA_MAP,
  getEquipment,
  GUIDED_TOUR_ORDER,
  type CameraViewMode,
} from "@/components/factory/simulation/factoryLayout";
import { stageToArea } from "@/components/factory/simulation/ProductionState";

const STAGE_DURATION_MS = 3200;

type FactoryContextValue = {
  state: FactorySimulationState;
  startProduction: () => void;
  stopProduction: () => void;
  pauseProduction: () => void;
  resumeProduction: () => void;
  nextProductionStage: () => void;
  prevProductionStage: () => void;
  selectArea: (id: FactoryAreaId | null) => void;
  selectEquipment: (id: string | null) => void;
  selectWorker: (id: string | null) => void;
  startGuidedTour: () => void;
  stopGuidedTour: () => void;
  advanceGuidedTour: () => void;
  setIntroComplete: (value: boolean) => void;
  flyToArea: (id: FactoryAreaId) => void;
  enterRoomView: (id: FactoryAreaId) => void;
  exitRoomView: () => void;
  setSceneViewMode: (mode: SceneViewMode) => void;
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
  const stageIndexRef = useRef(0);
  const pausedRef = useRef(false);

  const registerFlyHandler = useCallback((handler: (id: FactoryAreaId, mode?: CameraViewMode) => void) => {
    flyHandlerRef.current = handler;
  }, []);

  const flyToArea = useCallback((id: FactoryAreaId, mode?: CameraViewMode) => {
    flyHandlerRef.current?.(id, mode);
    setState((s) => ({ ...s, selectedAreaId: id }));
  }, []);

  const applyStageIndex = useCallback((index: number, fly = true) => {
    const clamped = Math.max(0, Math.min(index, PRODUCTION_STAGES.length - 1));
    stageIndexRef.current = clamped;
    const stage = PRODUCTION_STAGES[clamped];
    const area = stageToArea(stage);
    setState((s) => ({
      ...s,
      productionStage: stage,
      overallProgress: Math.round(((clamped + 1) / PRODUCTION_STAGES.length) * 100),
      activeAreaId: area,
      selectedAreaId: area,
      selectedEquipmentId: null,
      selectedWorkerId: null,
      isSimulating: true,
    }));
    if (area && fly) flyHandlerRef.current?.(area, "overview");
  }, []);

  const clearSimTimer = useCallback(() => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    simTimerRef.current = null;
  }, []);

  const startSimTimer = useCallback(() => {
    clearSimTimer();
    simTimerRef.current = window.setInterval(() => {
      const next = stageIndexRef.current + 1;
      if (next >= PRODUCTION_STAGES.length) {
        clearSimTimer();
        setState((s) => ({
          ...s,
          isSimulating: false,
          productionStage: "finished",
          overallProgress: 100,
          activeAreaId: "finished-goods",
          selectedAreaId: "finished-goods",
          selectedEquipmentId: null,
          selectedWorkerId: null,
          productionPaused: false,
        }));
        flyHandlerRef.current?.("finished-goods", "overview");
        return;
      }
      applyStageIndex(next);
    }, STAGE_DURATION_MS);
  }, [applyStageIndex, clearSimTimer]);

  const selectArea = useCallback((id: FactoryAreaId | null) => {
    setState((s) => {
      if (id) {
        const cameraMode: CameraViewMode =
          s.sceneViewMode === "room" ? "room-interior" : "cinematic";
        flyHandlerRef.current?.(id, cameraMode);
      }
      return {
        ...s,
        selectedAreaId: id,
        selectedEquipmentId: null,
        selectedWorkerId: null,
        ...(id && s.sceneViewMode === "room" ? { roomAreaId: id } : {}),
      };
    });
  }, []);

  const enterRoomView = useCallback((id: FactoryAreaId) => {
    setState((s) => ({
      ...s,
      sceneViewMode: "room",
      roomAreaId: id,
      selectedAreaId: id,
      selectedEquipmentId: null,
      selectedWorkerId: null,
      guidedTourActive: false,
    }));
    flyHandlerRef.current?.(id, "room-interior");
  }, []);

  const exitRoomView = useCallback(() => {
    setState((s) => {
      const id = s.roomAreaId ?? s.selectedAreaId;
      if (id) flyHandlerRef.current?.(id, "cinematic");
      return {
        ...s,
        sceneViewMode: "facility",
        roomAreaId: null,
      };
    });
  }, []);

  const setSceneViewMode = useCallback((mode: SceneViewMode) => {
    setState((s) => {
      if (mode === "room") {
        const id = s.roomAreaId ?? s.selectedAreaId ?? "bioreactor";
        flyHandlerRef.current?.(id, "room-interior");
        return { ...s, sceneViewMode: "room", roomAreaId: id, selectedAreaId: id };
      }
      const id = s.roomAreaId ?? s.selectedAreaId;
      if (id) flyHandlerRef.current?.(id, "cinematic");
      return { ...s, sceneViewMode: "facility", roomAreaId: null };
    });
  }, []);

  const selectEquipment = useCallback((id: string | null) => {
    setState((s) => {
      if (!id) {
        return { ...s, selectedEquipmentId: null };
      }
      const eq = getEquipment(id);
      return {
        ...s,
        selectedEquipmentId: id,
        selectedWorkerId: null,
        selectedAreaId: eq?.areaId ?? s.selectedAreaId,
      };
    });
  }, []);

  const selectWorker = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedWorkerId: id, selectedEquipmentId: null }));
  }, []);

  const stopProduction = useCallback(() => {
    clearSimTimer();
    stageIndexRef.current = 0;
    setState((s) => ({
      ...s,
      isSimulating: false,
      productionStage: "idle",
      overallProgress: 0,
      activeAreaId: null,
      productionPaused: false,
    }));
  }, [clearSimTimer]);

  const startProduction = useCallback(() => {
    stopProduction();
    pausedRef.current = false;
    setState((s) => ({
      ...s,
      sceneViewMode: "facility",
      roomAreaId: null,
      productionPaused: false,
    }));
    applyStageIndex(0);
    startSimTimer();
  }, [stopProduction, applyStageIndex, startSimTimer]);

  const pauseProduction = useCallback(() => {
    clearSimTimer();
    pausedRef.current = true;
    setState((s) => ({ ...s, productionPaused: true }));
  }, [clearSimTimer]);

  const resumeProduction = useCallback(() => {
    pausedRef.current = false;
    setState((s) => {
      if (!s.isSimulating) return s;
      return { ...s, productionPaused: false };
    });
    startSimTimer();
  }, [startSimTimer]);

  const nextProductionStage = useCallback(() => {
    const next = Math.min(stageIndexRef.current + 1, PRODUCTION_STAGES.length - 1);
    applyStageIndex(next);
    if (!pausedRef.current) startSimTimer();
  }, [applyStageIndex, startSimTimer]);

  const prevProductionStage = useCallback(() => {
    const prev = Math.max(stageIndexRef.current - 1, 0);
    applyStageIndex(prev);
    if (!pausedRef.current) startSimTimer();
  }, [applyStageIndex, startSimTimer]);

  const startGuidedTour = useCallback(() => {
    stopProduction();
    setState((s) => ({
      ...s,
      guidedTourActive: true,
      guidedTourIndex: 0,
      selectedAreaId: GUIDED_TOUR_ORDER[0],
      sceneViewMode: "facility",
      roomAreaId: null,
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

  useEffect(() => () => clearSimTimer(), [clearSimTimer]);

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
      pauseProduction,
      resumeProduction,
      nextProductionStage,
      prevProductionStage,
      selectArea,
      selectEquipment,
      selectWorker,
      startGuidedTour,
      stopGuidedTour,
      advanceGuidedTour,
      setIntroComplete,
      flyToArea,
      enterRoomView,
      exitRoomView,
      setSceneViewMode,
      registerFlyHandler,
    }),
    [
      state,
      startProduction,
      stopProduction,
      pauseProduction,
      resumeProduction,
      nextProductionStage,
      prevProductionStage,
      selectArea,
      selectEquipment,
      selectWorker,
      startGuidedTour,
      stopGuidedTour,
      advanceGuidedTour,
      setIntroComplete,
      flyToArea,
      enterRoomView,
      exitRoomView,
      setSceneViewMode,
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
