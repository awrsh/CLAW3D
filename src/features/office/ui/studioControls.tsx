"use client";

import { useEffect, useState, type ReactNode } from "react";

export const studioPanelClass =
  "pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-studio-border bg-studio-surface/92 shadow-studio-panel backdrop-blur-md";

export const studioSurfaceClass =
  "rounded-lg border border-studio-border-subtle bg-studio-surface-elevated/80";

type PanelShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
  bodyClassName?: string;
};

export function PanelShell({
  title,
  subtitle,
  children,
  footer,
  actions,
  className = "",
  dir = "rtl",
  bodyClassName = "space-y-3 overflow-y-auto p-3",
}: PanelShellProps) {
  return (
    <aside dir={dir} className={`${studioPanelClass} ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-studio-border-subtle px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold tracking-wide text-studio-text-heading">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-[10px] text-studio-text-muted">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
      <div className={bodyClassName}>{children}</div>
      {footer ? (
        <div className="border-t border-studio-border-subtle/75 px-3 py-2 text-[10px] leading-5 text-studio-text-muted">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

export type PanelMotionVariant = "slide-left" | "slide-right" | "fade-up";

type AnimatedPanelProps = {
  open: boolean;
  variant?: PanelMotionVariant;
  className?: string;
  children: ReactNode;
};

/** Mount/unmount wrapper with slide or fade transitions. */
export function AnimatedPanel({
  open,
  variant = "fade-up",
  className = "",
  children,
}: AnimatedPanelProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  const motionClass =
    variant === "slide-left"
      ? "studio-panel-slide-left"
      : variant === "slide-right"
        ? "studio-panel-slide-right"
        : "studio-panel-fade-up";

  return (
    <div
      className={`studio-panel-motion ${motionClass} ${
        visible ? "studio-panel-visible" : "studio-panel-hidden"
      } ${className}`}
    >
      {children}
    </div>
  );
}

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  title?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  const pad = size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]";
  return (
    <div
      className={`flex flex-wrap gap-1 rounded-lg border border-studio-border-subtle bg-studio-surface-deep/70 p-1 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={`${pad} min-w-0 flex-1 rounded-md font-medium tracking-wide transition ${
              active
                ? "bg-studio-accent-soft text-studio-accent-text shadow-sm ring-1 ring-studio-border-strong"
                : "text-studio-text-soft hover:bg-studio-surface-hover hover:text-studio-text-heading"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
};

export function ToggleRow({ label, checked, onChange, hint }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-0.5 py-0.5">
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-studio-text-heading">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[10px] text-studio-text-muted">
            {hint}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked
            ? "bg-studio-accent/80"
            : "bg-amber-950/80 ring-1 ring-studio-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-studio-knob shadow transition ${
            checked ? "right-0.5" : "right-4.5"
          }`}
        />
      </button>
    </label>
  );
}

type SliderFieldProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onEditStart?: () => void;
  decimals?: number;
};

export function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  onEditStart,
  decimals = 2,
}: SliderFieldProps) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-studio-text-heading">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-amber-400/80">
          {value.toFixed(decimals)}
          {hint ? (
            <span className="mr-1 text-studio-text-muted">{hint}</span>
          ) : null}
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-amber-950/60 accent-studio-accent"
      />
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
        className="w-full rounded-lg border border-studio-border-subtle bg-studio-surface-deep/80 px-2.5 py-1.5 font-mono text-[11px] text-studio-text-heading outline-none transition focus:border-studio-border-strong"
      />
    </label>
  );
}

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-studio-text-heading">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded-md border border-studio-border-subtle bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-28 rounded-lg border border-studio-border-subtle bg-studio-surface-deep/80 px-2 py-1.5 font-mono text-[11px] text-studio-text-heading outline-none focus:border-studio-border-strong"
        />
      </span>
    </label>
  );
}

type GhostButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit";
};

export function GhostButton({
  children,
  onClick,
  disabled,
  danger,
  active,
  className = "",
  title,
  type = "button",
}: GhostButtonProps) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition disabled:opacity-40 ${
        active
          ? "border-studio-border-strong bg-studio-accent-soft text-studio-accent-text"
          : danger
            ? "border-studio-border-subtle bg-studio-surface-elevated text-studio-text-soft hover:border-red-500/40 hover:text-red-300"
            : "border-studio-border-subtle bg-studio-surface-elevated text-studio-text-soft hover:border-studio-border-strong hover:bg-studio-surface-hover hover:text-studio-text-heading"
      } ${className}`}
    >
      {children}
    </button>
  );
}

type SectionLabelProps = {
  children: ReactNode;
  action?: ReactNode;
};

export function SectionLabel({ children, action }: SectionLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[10px] font-semibold tracking-[0.14em] text-studio-text-muted">
        {children}
      </div>
      {action}
    </div>
  );
}

type EmptyHintProps = {
  children: ReactNode;
};

export function EmptyHint({ children }: EmptyHintProps) {
  return (
    <div className="rounded-lg border border-dashed border-studio-border-subtle px-3 py-3 text-center text-[10px] leading-5 text-studio-text-muted">
      {children}
    </div>
  );
}
