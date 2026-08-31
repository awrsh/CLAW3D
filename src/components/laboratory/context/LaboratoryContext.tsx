"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getEquipmentMeta } from "@/components/laboratory/sceneConfig";
import type {
  EquipmentId,
  LaboratorySelection,
} from "@/components/laboratory/types";

type LaboratoryContextValue = {
  hoveredId: EquipmentId | null;
  selected: LaboratorySelection;
  setHoveredId: (id: EquipmentId | null) => void;
  selectEquipment: (id: EquipmentId | null) => void;
};

const LaboratoryContext = createContext<LaboratoryContextValue | null>(null);

export function LaboratoryProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredId] = useState<EquipmentId | null>(null);
  const [selected, setSelected] = useState<LaboratorySelection>(null);

  const selectEquipment = useCallback((id: EquipmentId | null) => {
    if (!id) {
      setSelected(null);
      return;
    }
    const meta = getEquipmentMeta(id);
    if (!meta) {
      setSelected(null);
      return;
    }
    setSelected({ id, meta });
  }, []);

  const value = useMemo(
    () => ({
      hoveredId,
      selected,
      setHoveredId,
      selectEquipment,
    }),
    [hoveredId, selected, selectEquipment],
  );

  return (
    <LaboratoryContext.Provider value={value}>
      {children}
    </LaboratoryContext.Provider>
  );
}

export function useLaboratory() {
  const ctx = useContext(LaboratoryContext);
  if (!ctx) {
    throw new Error("useLaboratory must be used within LaboratoryProvider");
  }
  return ctx;
}
