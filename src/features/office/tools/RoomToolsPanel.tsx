"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createAgent } from "@/features/office/core/agents";
import {
  changePlacedObjectType,
  createPlacedObject,
  formatObjectIdShort,
  getObjectLabel,
  isWallType,
  OBJECT_CATALOG,
  OBJECT_CATEGORIES,
  OBJECT_LIMITS,
  snapOntoNearbySurface,
  swapPlacedObjectTransforms,
  type ObjectCategory,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";
import { ROOM_PRESETS } from "@/features/office/core/roomPresets";
import {
  applyPresetToFloor,
  createFloor,
  duplicateFloor,
  getActiveFloor,
  getSelectedObject,
  isDrawWallType,
  MAX_FLOORS,
  PERFORMANCE_MODE_OPTIONS,
  ROOM_LIMITS,
  type BuildingConfig,
  type FloorConfig,
  type StructureConfig,
  type WorkspaceUnit,
} from "@/features/office/core/roomConfig";
import {
  ColorField,
  EmptyHint,
  GhostButton,
  AnimatedPanel,
  PanelShell,
  SectionLabel,
  SegmentedControl,
  SliderField,
  ToggleRow,
  studioSurfaceClass,
} from "@/features/office/ui/studioControls";

type RoomToolsPanelProps = {
  building: BuildingConfig;
  onChange: (next: BuildingConfig) => void;
  onReset: () => void;
  open?: boolean;
  onClose?: () => void;
  /** Snapshot current building before an object transform edit (for Ctrl+Z). */
  onBeforeObjectEdit?: () => void;
};

type ToolsTab = "place" | "edit" | "space" | "build";

const TOOLS_TABS: Array<{ value: ToolsTab; label: string; hint: string }> = [
  { value: "place", label: "جایگذاری", hint: "افزودن شیء" },
  { value: "edit", label: "ویرایش", hint: "جابه‌جایی و تنظیم" },
  { value: "space", label: "فضا", hint: "واحد و رنگ" },
  { value: "build", label: "ساختمان", hint: "طبقات و ساختار" },
];

/**
 * On-site Tools: floors, structure connectors, and placeable objects.
 */
export function RoomToolsPanel({
  building,
  onChange,
  onReset,
  open = true,
  onClose,
  onBeforeObjectEdit,
}: RoomToolsPanelProps) {
  const [tab, setTab] = useState<ToolsTab>("place");
  const [objectCategory, setObjectCategory] =
    useState<ObjectCategory>("structure");
  const [catalogQuery, setCatalogQuery] = useState("");
  const prevSelectedId = useRef<string | null>(null);

  const active = getActiveFloor(building);
  const selected = getSelectedObject(building);
  const workspaces = active.workspaces ?? [];
  const selectedWorkspace =
    workspaces.find((unit) => unit.id === building.selectedWorkspaceId) ??
    null;

  const catalogItems = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return OBJECT_CATALOG.filter((item) => {
      if (item.category !== objectCategory) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    });
  }, [catalogQuery, objectCategory]);

  // Jump to Edit when user selects an object on the scene.
  useEffect(() => {
    const id = building.selectedObjectId;
    if (id && id !== prevSelectedId.current) {
      setTab("edit");
    }
    prevSelectedId.current = id;
  }, [building.selectedObjectId]);

  // Prefer Place tab while drawing walls.
  useEffect(() => {
    if (building.drawMode === "wall") setTab("place");
  }, [building.drawMode]);

  const patchBuilding = (partial: Partial<BuildingConfig>) => {
    onChange({ ...building, ...partial });
  };

  const patchStructure = <K extends keyof StructureConfig>(
    key: K,
    value: StructureConfig[K],
  ) => {
    onChange({
      ...building,
      structure: { ...building.structure, [key]: value },
    });
  };

  const patchActiveFloor = <K extends keyof FloorConfig>(
    key: K,
    value: FloorConfig[K],
  ) => {
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id === active.id ? { ...floor, [key]: value } : floor,
      ),
    });
  };

  const updateSelectedObject = <K extends keyof PlacedObject>(
    key: K,
    value: PlacedObject[K],
  ) => {
    if (!selected) return;
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              objects: floor.objects.map((object) =>
                object.id === selected.id
                  ? { ...object, [key]: value }
                  : object,
              ),
            },
      ),
    });
  };

  const changeSelectedType = (nextType: ObjectType) => {
    if (!selected) return;
    onBeforeObjectEdit?.();
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              objects: floor.objects.map((object) =>
                object.id === selected.id
                  ? changePlacedObjectType(object, nextType)
                  : object,
              ),
            },
      ),
    });
  };

  const swapSelectedWith = (otherId: string) => {
    if (!selected || otherId === selected.id) return;
    onBeforeObjectEdit?.();
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              objects: swapPlacedObjectTransforms(
                floor.objects,
                selected.id,
                otherId,
              ),
            },
      ),
    });
  };

  const addFloor = () => {
    if (building.floors.length >= MAX_FLOORS) return;
    const next = createFloor(building.floors.length);
    onChange({
      ...building,
      floors: [...building.floors, next],
      activeFloorId: next.id,
      selectedObjectId: null,
      selectedWorkspaceId: null,
      structure: {
        ...building.structure,
        showStairs: true,
        showColumns: true,
      },
    });
  };

  const duplicateActiveFloor = () => {
    const next = duplicateFloor(building, active.id);
    if (next) onChange(next);
  };

  const removeActiveFloor = () => {
    if (building.floors.length <= 1) return;
    const remaining = building.floors.filter((floor) => floor.id !== active.id);
    onChange({
      ...building,
      floors: remaining,
      activeFloorId: remaining[remaining.length - 1]!.id,
      selectedObjectId: null,
      selectedWorkspaceId: null,
    });
  };

  const patchWorkspace = <K extends keyof WorkspaceUnit>(
    workspaceId: string,
    key: K,
    value: WorkspaceUnit[K],
  ) => {
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              workspaces: (floor.workspaces ?? []).map((unit) =>
                unit.id === workspaceId ? { ...unit, [key]: value } : unit,
              ),
            },
      ),
    });
  };

  const removeWorkspace = (workspaceId: string) => {
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              workspaces: (floor.workspaces ?? []).filter(
                (unit) => unit.id !== workspaceId,
              ),
            },
      ),
      selectedWorkspaceId:
        building.selectedWorkspaceId === workspaceId
          ? null
          : building.selectedWorkspaceId,
    });
  };

  const applyPreset = (presetId: (typeof ROOM_PRESETS)[number]["id"]) => {
    const preset = ROOM_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    const workspaceId = building.selectedWorkspaceId;
    onChange(
      applyPresetToFloor(
        building,
        active.id,
        preset.objects,
        preset.agents,
        workspaceId
          ? undefined
          : preset.id === "empty"
            ? active.label
            : preset.label,
        workspaceId
          ? {
              workspaceId,
              designWidth: preset.designWidth,
              designDepth: preset.designDepth,
            }
          : undefined,
      ),
    );
  };

  const addAgent = () => {
    const agent = createAgent(active.agents?.length ?? 0);
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id === active.id
          ? { ...floor, agents: [...(floor.agents ?? []), agent] }
          : floor,
      ),
    });
  };

  const toggleAgentRoam = (agentId: string) => {
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id !== active.id
          ? floor
          : {
              ...floor,
              agents: (floor.agents ?? []).map((agent) =>
                agent.id === agentId
                  ? { ...agent, roam: !agent.roam }
                  : agent,
              ),
            },
      ),
    });
  };

  const removeAgent = (agentId: string) => {
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id === active.id
          ? {
              ...floor,
              agents: (floor.agents ?? []).filter(
                (agent) => agent.id !== agentId,
              ),
            }
          : floor,
      ),
    });
  };

  const snapSelectedToSurface = () => {
    if (!selected) return;
    const snapped = snapOntoNearbySurface(selected, active.objects, {
      force: true,
    });
    updateSelectedObject("elevation", snapped.elevation);
  };

  const addObject = (type: ObjectType) => {
    if (isDrawWallType(type)) {
      const togglingOff =
        building.drawMode === "wall" && building.drawWallType === type;
      onChange({
        ...building,
        editMode: true,
        drawMode: togglingOff ? "none" : "wall",
        drawWallType: type,
        selectedObjectId: null,
      });
      return;
    }

    const object = createPlacedObject(type, active.objects.length);
    onChange({
      ...building,
      editMode: true,
      drawMode: "none",
      floors: building.floors.map((floor) =>
        floor.id === active.id
          ? { ...floor, objects: [...floor.objects, object] }
          : floor,
      ),
      selectedObjectId: object.id,
      selectedWorkspaceId: null,
    });
  };

  const removeSelectedObject = () => {
    if (!selected) return;
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id === active.id
          ? {
              ...floor,
              objects: floor.objects.filter(
                (object) => object.id !== selected.id,
              ),
            }
          : floor,
      ),
      selectedObjectId: null,
    });
  };

  const subtitle =
    building.drawMode === "wall"
      ? `رسم دیوار · ${getObjectLabel(building.drawWallType)}`
      : selected
        ? `انتخاب: ${getObjectLabel(selected.type)}`
        : active.label;

  return (
    <AnimatedPanel
      open={open}
      variant="slide-right"
      className="absolute top-[4.5rem] bottom-4 right-4 z-20 w-[min(100%-2rem,420px)]"
    >
      <PanelShell
        title="ابزارها"
        subtitle={subtitle}
        className="h-full max-h-full"
      actions={
        <>
          <GhostButton onClick={onReset} title="بازنشانی ساختمان">
            ریست
          </GhostButton>
          {onClose ? (
            <GhostButton onClick={onClose} title="بستن پنل">
              بستن
            </GhostButton>
          ) : null}
        </>
      }
      bodyClassName="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3"
      footer={
        building.editMode
          ? "ویرایش فعال · کلیک + درگ برای جابه‌جایی · Ctrl+Z برای Undo"
          : "حالت مشاهده · «ویرایش» را از نوار بالا روشن کنید."
      }
    >
      <SegmentedControl
        value={tab}
        options={TOOLS_TABS.map(({ value, label, hint }) => ({
          value,
          label,
          title: hint,
        }))}
        onChange={setTab}
      />

      {selected && tab !== "edit" ? (
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`${studioSurfaceClass} flex w-full items-center justify-between gap-2 px-2.5 py-2 text-right transition hover:border-amber-500/35`}
        >
          <span className="text-[10px] text-amber-500/70">انتخاب فعال</span>
          <span className="truncate text-[11px] font-medium text-amber-100">
            {getObjectLabel(selected.type)}
          </span>
        </button>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        {tab === "place" ? (
          <div className="space-y-3">
            <SectionLabel>کاتالوگ</SectionLabel>
            <input
              type="search"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="جستجو در ابجکت‌ها…"
              className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-2 text-[12px] text-amber-100 outline-none placeholder:text-amber-500/40 focus:border-amber-500/45"
            />
            <div className="sticky top-0 z-1 -mx-0.5 flex flex-wrap gap-1 bg-[#120e08]/95 px-0.5 py-1 backdrop-blur-sm">
              {OBJECT_CATEGORIES.map((category) => {
                const activeCat = objectCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setObjectCategory(category.id)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                      activeCat
                        ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/35"
                        : "text-amber-200/55 hover:bg-[#261e16] hover:text-amber-100"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            {building.drawMode === "wall" ? (
              <div className={`${studioSurfaceClass} px-2.5 py-2 text-[10px] leading-5 text-amber-300/80`}>
                حالت رسم فعال — روی زمین درگ کنید. دوباره همان دکمه را بزنید تا
                لغو شود.
              </div>
            ) : null}
            {catalogItems.length === 0 ? (
              <EmptyHint>موردی پیدا نشد.</EmptyHint>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {catalogItems.map((item) => {
                  const isWallDraw =
                    isDrawWallType(item.type) &&
                    building.drawMode === "wall" &&
                    building.drawWallType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addObject(item.type)}
                      className={`rounded-lg border px-2 py-2.5 text-right text-[11px] transition ${
                        isWallDraw
                          ? "border-amber-500/50 bg-amber-500/20 text-amber-200"
                          : "border-amber-900/20 bg-[#0e0b07]/70 text-amber-200/75 hover:border-amber-500/35 hover:bg-[#261e16] hover:text-amber-100"
                      }`}
                    >
                      <span className="opacity-50">
                        {isDrawWallType(item.type) ? "✎ " : "+ "}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {tab === "edit" ? (
          <div className="space-y-3">
            {selected ? (
              <div className={`${studioSurfaceClass} space-y-3 p-2.5`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-amber-100">
                      {getObjectLabel(selected.type)}
                    </div>
                    <div
                      className="mt-0.5 truncate font-mono text-[10px] text-amber-400/80"
                      title={selected.id}
                    >
                      id: {selected.id}
                    </div>
                  </div>
                  <GhostButton danger onClick={removeSelectedObject}>
                    حذف
                  </GhostButton>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-amber-100">
                    نوع ابجکت (id ثابت می‌ماند)
                  </span>
                  <select
                    value={selected.type}
                    onChange={(event) =>
                      changeSelectedType(event.target.value as ObjectType)
                    }
                    className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-1.5 text-xs text-amber-100 outline-none focus:border-amber-500/45"
                  >
                    {OBJECT_CATALOG.map((item) => (
                      <option key={item.type} value={item.type}>
                        {item.label} ({item.type})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-amber-100">
                    تعویض جای با ابجکت دیگر
                  </span>
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const otherId = event.target.value;
                      if (!otherId) return;
                      swapSelectedWith(otherId);
                      event.target.value = "";
                    }}
                    className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-1.5 text-xs text-amber-100 outline-none focus:border-amber-500/45"
                  >
                    <option value="">انتخاب برای تعویض موقعیت…</option>
                    {active.objects
                      .filter((object) => object.id !== selected.id)
                      .map((object) => (
                        <option key={object.id} value={object.id}>
                          {getObjectLabel(object.type)} ·{" "}
                          {formatObjectIdShort(object.id, 22)}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] leading-4 text-amber-500/50">
                    فقط مختصات عوض می‌شود؛ id هر ابجکت سر جایش می‌ماند (مثلاً میز
                    مدیر و میز فرانت جدا می‌مانند).
                  </p>
                </label>
                <SliderField
                  label="ارتفاع"
                  hint="Y"
                  value={selected.elevation}
                  min={OBJECT_LIMITS.elevation.min}
                  max={OBJECT_LIMITS.elevation.max}
                  step={OBJECT_LIMITS.elevation.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("elevation", value)}
                />
                <GhostButton
                  className="w-full"
                  onClick={() => {
                    onBeforeObjectEdit?.();
                    snapSelectedToSurface();
                  }}
                >
                  چسباندن روی سطح زیرین
                </GhostButton>
                {isWallType(selected.type) ? (
                  <SliderField
                    label="طول دیوار / در"
                    value={selected.length}
                    min={OBJECT_LIMITS.length.min}
                    max={OBJECT_LIMITS.length.max}
                    step={OBJECT_LIMITS.length.step}
                    onEditStart={onBeforeObjectEdit}
                    onChange={(value) => updateSelectedObject("length", value)}
                  />
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                <SliderField
                  label="موقعیت X"
                  value={selected.x}
                  min={OBJECT_LIMITS.x.min}
                  max={OBJECT_LIMITS.x.max}
                  step={OBJECT_LIMITS.x.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("x", value)}
                />
                <SliderField
                  label="موقعیت Z"
                  value={selected.z}
                  min={OBJECT_LIMITS.z.min}
                  max={OBJECT_LIMITS.z.max}
                  step={OBJECT_LIMITS.z.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("z", value)}
                />
                <SliderField
                  label="چرخش"
                  hint="°"
                  value={selected.rotationY}
                  min={OBJECT_LIMITS.rotationY.min}
                  max={OBJECT_LIMITS.rotationY.max}
                  step={OBJECT_LIMITS.rotationY.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("rotationY", value)}
                />
                <SliderField
                  label="مقیاس"
                  value={selected.scale}
                  min={OBJECT_LIMITS.scale.min}
                  max={OBJECT_LIMITS.scale.max}
                  step={OBJECT_LIMITS.scale.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("scale", value)}
                />
                </div>
              </div>
            ) : (
              <EmptyHint>
                ابجکتی انتخاب نشده. از صحنه یا لیست زیر یکی را برگزینید.
              </EmptyHint>
            )}

            <SectionLabel>ابجکت‌های طبقه</SectionLabel>
            {active.objects.length === 0 ? (
              <EmptyHint>هنوز ابجکتی نیست — از تب جایگذاری اضافه کنید.</EmptyHint>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {active.objects.map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    onClick={() =>
                      patchBuilding({
                        selectedObjectId: object.id,
                        selectedWorkspaceId: null,
                      })
                    }
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition ${
                      object.id === building.selectedObjectId
                        ? "border border-amber-500/40 bg-amber-500/15 text-amber-200"
                        : "border border-transparent text-amber-200/70 hover:bg-[#261e16]"
                    }`}
                  >
                    <span className="min-w-0 truncate text-right">
                      <span className="block truncate">
                        {getObjectLabel(object.type)}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[9px] opacity-55">
                        {formatObjectIdShort(object.id)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] opacity-45">
                      {object.x.toFixed(1)}, {object.z.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "space" ? (
          <div className="space-y-4">
            <section className="space-y-2">
              <SectionLabel>محیط‌های کاری ({workspaces.length})</SectionLabel>
              <p className="text-[10px] leading-5 text-amber-200/50">
                با دکمهٔ «محیط کاری» روی صحنه رسم کنید.
              </p>
              {workspaces.length === 0 ? (
                <EmptyHint>هنوز واحدی روی این طبقه نیست.</EmptyHint>
              ) : (
                <ul className="space-y-1.5">
                  {workspaces.map((unit) => {
                    const isSelected = unit.id === building.selectedWorkspaceId;
                    return (
                      <li
                        key={unit.id}
                        className={`rounded-lg border px-2.5 py-2 ${
                          isSelected
                            ? "border-amber-500/40 bg-amber-500/12"
                            : "border-amber-900/25 bg-[#0e0b07]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              patchBuilding({
                                selectedWorkspaceId: unit.id,
                                selectedObjectId: null,
                              })
                            }
                            className="min-w-0 flex-1 text-right text-[11px] text-amber-100 hover:text-amber-200"
                          >
                            <div className="truncate font-semibold">
                              {unit.label}
                            </div>
                            <div className="mt-0.5 font-mono text-[9px] text-amber-500/55">
                              {unit.width.toFixed(1)}×{unit.depth.toFixed(1)} ·{" "}
                              {unit.shape === "square" ? "مربع" : "مستطیل"}
                              {unit.withWalls ? " · دیوار" : ""}
                            </div>
                          </button>
                          <GhostButton
                            danger
                            onClick={() => removeWorkspace(unit.id)}
                          >
                            حذف
                          </GhostButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectedWorkspace ? (
                <div className={`${studioSurfaceClass} space-y-2 p-2.5`}>
                  <input
                    type="text"
                    value={selectedWorkspace.label}
                    onChange={(event) =>
                      patchWorkspace(
                        selectedWorkspace.id,
                        "label",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-1.5 text-xs text-amber-100 outline-none focus:border-amber-500/45"
                    placeholder="برچسب واحد"
                  />
                  <ColorField
                    label="رنگ کف"
                    value={selectedWorkspace.floorColor}
                    onChange={(value) =>
                      patchWorkspace(selectedWorkspace.id, "floorColor", value)
                    }
                  />
                  <ColorField
                    label="رنگ دیوار"
                    value={selectedWorkspace.wallColor}
                    onChange={(value) =>
                      patchWorkspace(selectedWorkspace.id, "wallColor", value)
                    }
                  />
                  <ToggleRow
                    label="با دیوار"
                    checked={selectedWorkspace.withWalls}
                    onChange={(checked) =>
                      patchWorkspace(selectedWorkspace.id, "withWalls", checked)
                    }
                  />
                </div>
              ) : null}
            </section>

            <section className="space-y-2">
              <SectionLabel>فضاهای آماده</SectionLabel>
              <p className="text-[10px] leading-5 text-amber-500/50">
                {selectedWorkspace
                  ? `اعمال روی «${selectedWorkspace.label}»`
                  : "بدون انتخاب واحد: روی کل طبقه اعمال می‌شود."}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {ROOM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.description}
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-lg border border-amber-900/20 bg-[#0e0b07]/70 px-2 py-2.5 text-right text-[11px] text-amber-200/75 transition hover:border-amber-500/35 hover:bg-[#261e16] hover:text-amber-100"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <SectionLabel
                action={
                  <GhostButton onClick={addAgent}>+ کاراکتر</GhostButton>
                }
              >
                کاراکترها
              </SectionLabel>
              {(active.agents ?? []).length === 0 ? (
                <EmptyHint>هنوز کاراکتری نیست.</EmptyHint>
              ) : (
                <div className="max-h-36 space-y-1 overflow-y-auto">
                  {(active.agents ?? []).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-2 rounded-lg border border-amber-900/15 px-2.5 py-1.5 text-[11px]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="flex-1 truncate text-amber-100">
                        {agent.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAgentRoam(agent.id)}
                        className="text-[10px] text-amber-300/85"
                      >
                        {agent.roam ? "گشت" : "ثابت"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAgent(agent.id)}
                        className="text-[10px] text-[#ef9a9a]"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "build" ? (
          <div className="space-y-4">
            <section className="space-y-2">
              <SectionLabel>طبقات</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {building.floors.map((floor, index) => (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() =>
                      patchBuilding({
                        activeFloorId: floor.id,
                        selectedObjectId: null,
                        selectedWorkspaceId: null,
                      })
                    }
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      floor.id === active.id
                        ? "border border-amber-500/45 bg-amber-500/25 text-amber-200"
                        : "border border-amber-900/25 bg-[#1c1610] text-amber-200/65 hover:border-amber-500/35"
                    }`}
                  >
                    {index}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <GhostButton
                  className="flex-1"
                  onClick={addFloor}
                  disabled={building.floors.length >= MAX_FLOORS}
                >
                  + طبقه
                </GhostButton>
                <GhostButton
                  className="flex-1"
                  onClick={duplicateActiveFloor}
                  disabled={building.floors.length >= MAX_FLOORS}
                >
                  کپی
                </GhostButton>
                <GhostButton
                  danger
                  onClick={removeActiveFloor}
                  disabled={building.floors.length <= 1}
                >
                  حذف
                </GhostButton>
              </div>
              <input
                type="text"
                value={active.label}
                onChange={(event) =>
                  patchActiveFloor("label", event.target.value)
                }
                className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-1.5 text-xs text-amber-100 outline-none focus:border-amber-500/45"
                placeholder="نام طبقه"
              />
              <SliderField
                label="فاصلهٔ عمودی طبقات"
                value={building.floorSpacing}
                min={ROOM_LIMITS.floorSpacing.min}
                max={ROOM_LIMITS.floorSpacing.max}
                step={ROOM_LIMITS.floorSpacing.step}
                onChange={(value) => patchBuilding({ floorSpacing: value })}
              />
              <ToggleRow
                label="نمایش همهٔ طبقات"
                checked={building.showAllFloors}
                onChange={(checked) =>
                  patchBuilding({ showAllFloors: checked })
                }
              />
              <ToggleRow
                label="Snap به گرید"
                checked={building.snapToGrid}
                onChange={(checked) => patchBuilding({ snapToGrid: checked })}
              />
              <ToggleRow
                label="Snap به دیوار"
                checked={building.snapToWall}
                onChange={(checked) => patchBuilding({ snapToWall: checked })}
              />
            </section>

            <section className="space-y-2">
              <SectionLabel>نور و صدا</SectionLabel>
              <SegmentedControl
                size="sm"
                value={building.lightingMode}
                onChange={(mode) => patchBuilding({ lightingMode: mode })}
                options={[
                  { value: "day", label: "روز" },
                  { value: "evening", label: "عصر" },
                  { value: "night", label: "شب" },
                ]}
              />
              <ToggleRow
                label="لامپ‌ها روشن"
                checked={building.lampsOn}
                onChange={(checked) => patchBuilding({ lampsOn: checked })}
              />
              <ToggleRow
                label="قطع صدا"
                checked={building.muteSfx}
                onChange={(checked) => patchBuilding({ muteSfx: checked })}
              />
              <SectionLabel>کیفیت رندر</SectionLabel>
              <SegmentedControl
                size="sm"
                value={building.performanceMode}
                onChange={(mode) => patchBuilding({ performanceMode: mode })}
                options={PERFORMANCE_MODE_OPTIONS}
              />
            </section>

            <section className="space-y-2">
              <SectionLabel>اتصال طبقات</SectionLabel>
              <ToggleRow
                label="راه‌پله"
                checked={building.structure.showStairs}
                onChange={(checked) => patchStructure("showStairs", checked)}
              />
              <ToggleRow
                label="ستون‌های گوشه"
                checked={building.structure.showColumns}
                onChange={(checked) => patchStructure("showColumns", checked)}
              />
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-amber-100">
                  گوشهٔ راه‌پله
                </span>
                <select
                  value={building.structure.stairsCorner}
                  onChange={(event) =>
                    patchStructure(
                      "stairsCorner",
                      event.target.value as StructureConfig["stairsCorner"],
                    )
                  }
                  className="w-full rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-1.5 text-xs text-amber-100 outline-none focus:border-amber-500/45"
                >
                  <option value="se">جنوب‌شرقی</option>
                  <option value="sw">جنوب‌غربی</option>
                  <option value="ne">شمال‌شرقی</option>
                  <option value="nw">شمال‌غربی</option>
                </select>
              </label>
              <SliderField
                label="شعاع ستون"
                value={building.structure.columnRadius}
                min={ROOM_LIMITS.columnRadius.min}
                max={ROOM_LIMITS.columnRadius.max}
                step={ROOM_LIMITS.columnRadius.step}
                onChange={(value) => patchStructure("columnRadius", value)}
              />
              {building.floors.length < 2 ? (
                <p className="text-[10px] leading-5 text-amber-500/50">
                  برای دیدن راه‌پله، حداقل یک طبقهٔ دیگر اضافه کنید.
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              <SectionLabel>اندازهٔ طبقه</SectionLabel>
              <SliderField
                label="طول (X)"
                value={active.width}
                min={ROOM_LIMITS.width.min}
                max={ROOM_LIMITS.width.max}
                step={ROOM_LIMITS.width.step}
                onChange={(value) => patchActiveFloor("width", value)}
              />
              <SliderField
                label="عرض (Z)"
                value={active.depth}
                min={ROOM_LIMITS.depth.min}
                max={ROOM_LIMITS.depth.max}
                step={ROOM_LIMITS.depth.step}
                onChange={(value) => patchActiveFloor("depth", value)}
              />
              <SliderField
                label="ارتفاع دیوار"
                value={active.wallHeight}
                min={ROOM_LIMITS.wallHeight.min}
                max={ROOM_LIMITS.wallHeight.max}
                step={ROOM_LIMITS.wallHeight.step}
                onChange={(value) => patchActiveFloor("wallHeight", value)}
              />
              <SliderField
                label="ضخامت دیوار"
                value={active.wallThickness}
                min={ROOM_LIMITS.wallThickness.min}
                max={ROOM_LIMITS.wallThickness.max}
                step={ROOM_LIMITS.wallThickness.step}
                onChange={(value) => patchActiveFloor("wallThickness", value)}
              />
            </section>

            <section className="space-y-2">
              <SectionLabel>ظاهر طبقه</SectionLabel>
              <ColorField
                label="رنگ کف"
                value={active.floorColor}
                onChange={(value) => patchActiveFloor("floorColor", value)}
              />
              <ColorField
                label="رنگ دیوار"
                value={active.wallColor}
                onChange={(value) => patchActiveFloor("wallColor", value)}
              />
              <ToggleRow
                label="خطوط دانهٔ چوب"
                checked={active.showFloorGrain}
                onChange={(checked) =>
                  patchActiveFloor("showFloorGrain", checked)
                }
              />
            </section>
          </div>
        ) : null}
      </div>
    </PanelShell>
    </AnimatedPanel>
  );
}
