"use client";

import { useMemo, useState } from "react";
import { createAgent } from "@/features/office/core/agents";
import {
  createPlacedObject,
  getObjectLabel,
  isWallType,
  OBJECT_CATALOG,
  OBJECT_CATEGORIES,
  OBJECT_LIMITS,
  snapOntoNearbySurface,
  type ObjectCategory,
  type ObjectType,
  type PlacedObject,
} from "@/features/office/core/objects";
import { ROOM_PRESETS } from "@/features/office/core/roomPresets";
import {
  applyPresetToFloor,
  createFloor,
  DEFAULT_BUILDING,
  duplicateFloor,
  getActiveFloor,
  getSelectedObject,
  MAX_FLOORS,
  ROOM_LIMITS,
  type BuildingConfig,
  type FloorConfig,
  type StructureConfig,
} from "@/features/office/core/roomConfig";

type RoomToolsPanelProps = {
  building: BuildingConfig;
  onChange: (next: BuildingConfig) => void;
  onReset: () => void;
  /** Snapshot current building before an object transform edit (for Ctrl+Z). */
  onBeforeObjectEdit?: () => void;
};

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  onEditStart,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onEditStart?: () => void;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-[#e8dcc8]">{label}</span>
        <span className="font-mono text-[11px] text-[#c8a97e]">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onEditStart}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#3a2a22] accent-[#c8a97e]"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onFocus={onEditStart}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) {
              onChange(Math.min(max, Math.max(min, next)));
            }
          }}
          className="w-full rounded border border-[#5d4037]/70 bg-[#140e0a] px-2 py-1.5 font-mono text-xs text-[#f5f0e8] outline-none focus:border-[#c8a97e]"
        />
        {hint ? (
          <span className="shrink-0 text-[10px] text-[#9a8b78]">{hint}</span>
        ) : null}
      </div>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-[#e8dcc8]">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-[#5d4037]/70 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-[7.5rem] rounded border border-[#5d4037]/70 bg-[#140e0a] px-2 py-1.5 font-mono text-xs text-[#f5f0e8] outline-none focus:border-[#c8a97e]"
        />
      </span>
    </label>
  );
}

/**
 * On-site Tools: floors, structure connectors, and placeable objects.
 */
export function RoomToolsPanel({
  building,
  onChange,
  onReset,
  onBeforeObjectEdit,
}: RoomToolsPanelProps) {
  const [objectCategory, setObjectCategory] =
    useState<ObjectCategory>("structure");
  const active = getActiveFloor(building);
  const selected = getSelectedObject(building);
  const catalogItems = useMemo(
    () => OBJECT_CATALOG.filter((item) => item.category === objectCategory),
    [objectCategory],
  );

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

  const addFloor = () => {
    if (building.floors.length >= MAX_FLOORS) return;
    const next = createFloor(building.floors.length);
    onChange({
      ...building,
      floors: [...building.floors, next],
      activeFloorId: next.id,
      selectedObjectId: null,
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
    });
  };

  const applyPreset = (presetId: (typeof ROOM_PRESETS)[number]["id"]) => {
    const preset = ROOM_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    onChange(
      applyPresetToFloor(
        building,
        active.id,
        preset.objects,
        preset.agents,
        preset.id === "empty" ? active.label : preset.label,
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
    const object = createPlacedObject(type, active.objects.length);
    onChange({
      ...building,
      floors: building.floors.map((floor) =>
        floor.id === active.id
          ? { ...floor, objects: [...floor.objects, object] }
          : floor,
      ),
      selectedObjectId: object.id,
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

  return (
    <aside
      dir="rtl"
      className="pointer-events-auto absolute bottom-4 left-4 z-20 flex max-h-[min(86vh,780px)] w-[min(100%-2rem,360px)] flex-col overflow-hidden rounded-xl border border-[#5d4037]/70 bg-[#1a1008]/92 shadow-2xl shadow-black/40 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-[#5d4037]/50 px-3 py-2.5">
        <div>
          <div className="text-sm font-semibold text-[#c8a97e]">Tools</div>
          <div className="text-[10px] text-[#9a8b78]">
            طبقات · سازه · ابجکت‌ها
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#5d4037]/70 px-2 py-1 text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e]"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-3">
        <section className="space-y-2">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            طبقات ساختمان
          </div>
          <div className="flex flex-wrap gap-1.5">
            {building.floors.map((floor, index) => (
              <button
                key={floor.id}
                type="button"
                onClick={() =>
                  patchBuilding({
                    activeFloorId: floor.id,
                    selectedObjectId: null,
                  })
                }
                className={`rounded px-2 py-1 text-[10px] transition ${
                  floor.id === active.id
                    ? "bg-[#c8a97e] text-[#1a1008]"
                    : "border border-[#5d4037]/70 text-[#d8d0c0] hover:border-[#c8a97e]"
                }`}
              >
                {index}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addFloor}
              disabled={building.floors.length >= MAX_FLOORS}
              className="flex-1 rounded border border-[#5d4037]/70 px-2 py-1.5 text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e] disabled:opacity-40"
            >
              + طبقه جدید
            </button>
            <button
              type="button"
              onClick={duplicateActiveFloor}
              disabled={building.floors.length >= MAX_FLOORS}
              className="flex-1 rounded border border-[#5d4037]/70 px-2 py-1.5 text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e] disabled:opacity-40"
            >
              کپی طبقه
            </button>
            <button
              type="button"
              onClick={removeActiveFloor}
              disabled={building.floors.length <= 1}
              className="rounded border border-[#5d4037]/70 px-2 py-1.5 text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e] disabled:opacity-40"
            >
              حذف
            </button>
          </div>
          <input
            type="text"
            value={active.label}
            onChange={(event) => patchActiveFloor("label", event.target.value)}
            className="w-full rounded border border-[#5d4037]/70 bg-[#140e0a] px-2 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#c8a97e]"
            placeholder="نام طبقه"
          />
          <NumberField
            label="فاصلهٔ عمودی طبقات"
            hint="واحد"
            value={building.floorSpacing}
            min={ROOM_LIMITS.floorSpacing.min}
            max={ROOM_LIMITS.floorSpacing.max}
            step={ROOM_LIMITS.floorSpacing.step}
            onChange={(value) => patchBuilding({ floorSpacing: value })}
          />
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              نمایش همهٔ طبقات با هم
            </span>
            <input
              type="checkbox"
              checked={building.showAllFloors}
              onChange={(event) =>
                patchBuilding({ showAllFloors: event.target.checked })
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              Snap به گرید
            </span>
            <input
              type="checkbox"
              checked={building.snapToGrid}
              onChange={(event) =>
                patchBuilding({ snapToGrid: event.target.checked })
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              Snap به دیوار
            </span>
            <input
              type="checkbox"
              checked={building.snapToWall}
              onChange={(event) =>
                patchBuilding({ snapToWall: event.target.checked })
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-[#e8dcc8]">نور</div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["day", "روز"],
                  ["evening", "عصر"],
                  ["night", "شب"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => patchBuilding({ lightingMode: mode })}
                  className={`rounded border px-2 py-1.5 text-[10px] transition ${
                    building.lightingMode === mode
                      ? "border-[#c8a97e] text-[#c8a97e]"
                      : "border-[#5d4037]/70 text-[#d8d0c0] hover:border-[#c8a97e]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              لامپ‌ها روشن
            </span>
            <input
              type="checkbox"
              checked={building.lampsOn}
              onChange={(event) =>
                patchBuilding({ lampsOn: event.target.checked })
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              قطع صدا
            </span>
            <input
              type="checkbox"
              checked={building.muteSfx}
              onChange={(event) =>
                patchBuilding({ muteSfx: event.target.checked })
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
        </section>

        <section className="space-y-2 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            فضاهای آماده
          </div>
          <p className="text-[10px] leading-5 text-[#9a8b78]">
            روی طبقهٔ فعال اعمال می‌شود و ابجکت‌های فعلی را جایگزین می‌کند.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                onClick={() => applyPreset(preset.id)}
                className="rounded border border-[#5d4037]/70 px-2 py-2 text-right text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            کاراکترها (حرکت و تعامل)
          </div>
          <button
            type="button"
            onClick={addAgent}
            className="w-full rounded border border-[#5d4037]/70 px-2 py-1.5 text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e]"
          >
            + کاراکتر جدید
          </button>
          {(active.agents ?? []).length === 0 ? (
            <p className="text-[10px] text-[#9a8b78]">
              هنوز کاراکتری نیست — یا از فضاهای آماده استفاده کنید.
            </p>
          ) : (
            <div className="max-h-28 space-y-1 overflow-y-auto">
              {(active.agents ?? []).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 rounded border border-[#5d4037]/40 px-2 py-1 text-[10px]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: agent.color }}
                  />
                  <span className="flex-1 text-[#e8dcc8]">{agent.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleAgentRoam(agent.id)}
                    className="text-[#c8a97e]"
                  >
                    {agent.roam ? "گشت" : "ثابت"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAgent(agent.id)}
                    className="text-[#ef9a9a]"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            اتصال طبقات (راه‌پله و ستون)
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">راه‌پله</span>
            <input
              type="checkbox"
              checked={building.structure.showStairs}
              onChange={(event) =>
                patchStructure("showStairs", event.target.checked)
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              ستون‌های گوشه
            </span>
            <input
              type="checkbox"
              checked={building.structure.showColumns}
              onChange={(event) =>
                patchStructure("showColumns", event.target.checked)
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
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
              className="w-full rounded border border-[#5d4037]/70 bg-[#140e0a] px-2 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#c8a97e]"
            >
              <option value="se">جنوب‌شرقی</option>
              <option value="sw">جنوب‌غربی</option>
              <option value="ne">شمال‌شرقی</option>
              <option value="nw">شمال‌غربی</option>
            </select>
          </label>
          <NumberField
            label="شعاع ستون"
            hint="واحد"
            value={building.structure.columnRadius}
            min={ROOM_LIMITS.columnRadius.min}
            max={ROOM_LIMITS.columnRadius.max}
            step={ROOM_LIMITS.columnRadius.step}
            onChange={(value) => patchStructure("columnRadius", value)}
          />
          {building.floors.length < 2 ? (
            <p className="text-[10px] leading-5 text-[#9a8b78]">
              برای دیدن راه‌پله و ستون، حداقل یک طبقهٔ دیگر اضافه کنید و «نمایش
              همهٔ طبقات» را روشن بگذارید.
            </p>
          ) : null}
        </section>

        <section className="space-y-3 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            ابجکت‌ها ({OBJECT_CATALOG.length} نوع — مثل old-version)
          </div>
          <p className="text-[10px] leading-5 text-[#9a8b78]">
            روی ابجکت کلیک‌نگه کنید و بکشید. کیبورد/ماوس/مانیتور را روی میز رها
            کنید تا خودکار روی سطح بنشیند. ارتفاع را از اسلایدر Elevation هم
            می‌توانید تنظیم کنید.
          </p>
          <div className="flex flex-wrap gap-1">
            {OBJECT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setObjectCategory(category.id)}
                className={`rounded px-2 py-1 text-[10px] transition ${
                  objectCategory === category.id
                    ? "bg-[#c8a97e] text-[#1a1008]"
                    : "border border-[#5d4037]/70 text-[#d8d0c0] hover:border-[#c8a97e]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
            {catalogItems.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addObject(item.type)}
                className="rounded border border-[#5d4037]/70 px-1.5 py-2 text-right text-[10px] text-[#d8d0c0] transition hover:border-[#c8a97e] hover:text-[#c8a97e]"
              >
                + {item.label}
              </button>
            ))}
          </div>

          {active.objects.length > 0 ? (
            <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-[#5d4037]/40 bg-[#140e0a]/70 p-1.5">
              {active.objects.map((object) => (
                <button
                  key={object.id}
                  type="button"
                  onClick={() =>
                    patchBuilding({ selectedObjectId: object.id })
                  }
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-[10px] transition ${
                    object.id === building.selectedObjectId
                      ? "bg-[#c8a97e]/20 text-[#c8a97e]"
                      : "text-[#d8d0c0] hover:bg-[#c8a97e]/10"
                  }`}
                >
                  <span>{getObjectLabel(object.type)}</span>
                  <span className="font-mono opacity-60">
                    {object.x.toFixed(1)}, {object.z.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-[#9a8b78]">
              هنوز ابجکتی نیست — از دسته‌ها یکی اضافه کنید.
            </p>
          )}

          {selected ? (
            <div className="space-y-3 rounded border border-[#c8a97e]/35 bg-[#c8a97e]/5 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#c8a97e]">
                  ویرایش: {getObjectLabel(selected.type)}
                </span>
                <button
                  type="button"
                  onClick={removeSelectedObject}
                  className="rounded border border-[#5d4037]/70 px-2 py-0.5 text-[10px] text-[#d8d0c0] hover:border-red-400 hover:text-red-300"
                >
                  حذف
                </button>
              </div>
              <NumberField
                label="ارتفاع (Elevation / Y)"
                hint="برای روی میز"
                value={selected.elevation}
                min={OBJECT_LIMITS.elevation.min}
                max={OBJECT_LIMITS.elevation.max}
                step={OBJECT_LIMITS.elevation.step}
                onEditStart={onBeforeObjectEdit}
                onChange={(value) => updateSelectedObject("elevation", value)}
              />
              <button
                type="button"
                onClick={() => {
                  onBeforeObjectEdit?.();
                  snapSelectedToSurface();
                }}
                className="w-full rounded border border-[#c8a97e]/50 px-2 py-1.5 text-[10px] text-[#c8a97e] transition hover:bg-[#c8a97e]/15"
              >
                چسباندن روی سطح زیرین (میز و …)
              </button>
              {isWallType(selected.type) ? (
                <NumberField
                  label="طول دیوار / در"
                  hint="واحد"
                  value={selected.length}
                  min={OBJECT_LIMITS.length.min}
                  max={OBJECT_LIMITS.length.max}
                  step={OBJECT_LIMITS.length.step}
                  onEditStart={onBeforeObjectEdit}
                  onChange={(value) => updateSelectedObject("length", value)}
                />
              ) : null}
              <NumberField
                label="موقعیت X"
                value={selected.x}
                min={OBJECT_LIMITS.x.min}
                max={OBJECT_LIMITS.x.max}
                step={OBJECT_LIMITS.x.step}
                onEditStart={onBeforeObjectEdit}
                onChange={(value) => updateSelectedObject("x", value)}
              />
              <NumberField
                label="موقعیت Z"
                value={selected.z}
                min={OBJECT_LIMITS.z.min}
                max={OBJECT_LIMITS.z.max}
                step={OBJECT_LIMITS.z.step}
                onEditStart={onBeforeObjectEdit}
                onChange={(value) => updateSelectedObject("z", value)}
              />
              <NumberField
                label="چرخش Y"
                hint="درجه"
                value={selected.rotationY}
                min={OBJECT_LIMITS.rotationY.min}
                max={OBJECT_LIMITS.rotationY.max}
                step={OBJECT_LIMITS.rotationY.step}
                onEditStart={onBeforeObjectEdit}
                onChange={(value) => updateSelectedObject("rotationY", value)}
              />
              <NumberField
                label="مقیاس"
                value={selected.scale}
                min={OBJECT_LIMITS.scale.min}
                max={OBJECT_LIMITS.scale.max}
                step={OBJECT_LIMITS.scale.step}
                onEditStart={onBeforeObjectEdit}
                onChange={(value) => updateSelectedObject("scale", value)}
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-3 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            اندازهٔ طبقهٔ فعال
          </div>
          <NumberField
            label="طول (Width / X)"
            hint="واحد"
            value={active.width}
            min={ROOM_LIMITS.width.min}
            max={ROOM_LIMITS.width.max}
            step={ROOM_LIMITS.width.step}
            onChange={(value) => patchActiveFloor("width", value)}
          />
          <NumberField
            label="عرض (Depth / Z)"
            hint="واحد"
            value={active.depth}
            min={ROOM_LIMITS.depth.min}
            max={ROOM_LIMITS.depth.max}
            step={ROOM_LIMITS.depth.step}
            onChange={(value) => patchActiveFloor("depth", value)}
          />
          <NumberField
            label="ارتفاع دیوار (Height / Y)"
            hint="واحد"
            value={active.wallHeight}
            min={ROOM_LIMITS.wallHeight.min}
            max={ROOM_LIMITS.wallHeight.max}
            step={ROOM_LIMITS.wallHeight.step}
            onChange={(value) => patchActiveFloor("wallHeight", value)}
          />
          <NumberField
            label="ضخامت دیوار"
            hint="واحد"
            value={active.wallThickness}
            min={ROOM_LIMITS.wallThickness.min}
            max={ROOM_LIMITS.wallThickness.max}
            step={ROOM_LIMITS.wallThickness.step}
            onChange={(value) => patchActiveFloor("wallThickness", value)}
          />
        </section>

        <section className="space-y-3 border-t border-[#5d4037]/40 pt-3">
          <div className="text-[10px] font-semibold tracking-wide text-[#9a8b78]">
            ظاهر طبقهٔ فعال
          </div>
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
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-[#e8dcc8]">
              خطوط دانهٔ چوب روی کف
            </span>
            <input
              type="checkbox"
              checked={active.showFloorGrain}
              onChange={(event) =>
                patchActiveFloor("showFloorGrain", event.target.checked)
              }
              className="h-4 w-4 accent-[#c8a97e]"
            />
          </label>
        </section>

        <section className="rounded border border-[#5d4037]/40 bg-[#140e0a]/80 p-2 text-[10px] leading-5 text-[#9a8b78]">
          پورت <span className="text-[#c8a97e]">3001</span> · بدون Gateway ·
          ابجکت را از لیست یا با کلیک روی صحنه انتخاب کنید.
        </section>
      </div>
    </aside>
  );
}
