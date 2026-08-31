"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InspectorPhase } from "@/components/laboratory/inspectorPatrol";

export type InspectorUiState = {
  visible: boolean;
  phase: InspectorPhase;
  activityLabel: string;
};

type LaboratoryInspectorContextValue = {
  enabled: boolean;
  inspector: InspectorUiState;
  setInspectorSnapshot: (snapshot: InspectorUiState) => void;
};

const defaultInspector: InspectorUiState = {
  visible: false,
  phase: "idle",
  activityLabel: "Off duty",
};

const LaboratoryInspectorContext =
  createContext<LaboratoryInspectorContextValue | null>(null);

export function LaboratoryInspectorProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [inspector, setInspector] = useState<InspectorUiState>(defaultInspector);

  const setInspectorSnapshot = useCallback((snapshot: InspectorUiState) => {
    setInspector((prev) =>
      prev.visible === snapshot.visible &&
      prev.phase === snapshot.phase &&
      prev.activityLabel === snapshot.activityLabel
        ? prev
        : snapshot,
    );
  }, []);

  const value = useMemo(
    () => ({ enabled, inspector, setInspectorSnapshot }),
    [enabled, inspector, setInspectorSnapshot],
  );

  return (
    <LaboratoryInspectorContext.Provider value={value}>
      {children}
    </LaboratoryInspectorContext.Provider>
  );
}

export function useInspectorReporter() {
  const ctx = useContext(LaboratoryInspectorContext);
  return useCallback(
    (snapshot: InspectorUiState) => {
      ctx?.setInspectorSnapshot(snapshot);
    },
    [ctx],
  );
}

export function useInspectorUi() {
  const ctx = useContext(LaboratoryInspectorContext);
  return ctx?.inspector ?? defaultInspector;
}
