"use client";

import { memo } from "react";
import {
  statusColor,
  statusLabelFa,
  workAgentDisplayName,
  type WorkPipeline,
  type WorkTodo,
  type WorkTodoStatus,
} from "@/features/office/core/workTodos";

type WorkTodosPanelProps = {
  pipeline: WorkPipeline;
  open: boolean;
  onClose: () => void;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onTodoClick?: (todo: WorkTodo) => void;
};

function StatusPill({ status }: { status: WorkTodoStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${statusColor(status)}22`,
        color: statusColor(status),
        border: `1px solid ${statusColor(status)}55`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: statusColor(status) }}
      />
      {statusLabelFa(status)}
    </span>
  );
}

function TodoCard({
  todo,
  all,
  onClick,
}: {
  todo: WorkTodo;
  all: WorkTodo[];
  onClick?: (todo: WorkTodo) => void;
}) {
  const deps = todo.dependencies
    .map((id) => all.find((entry) => entry.id === id)?.title ?? id)
    .map((title) => (title.length > 28 ? `${title.slice(0, 27)}…` : title));

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick?.(todo)}
        className={`w-full rounded-md border px-2.5 py-2 text-right transition hover:brightness-110 ${
          todo.status === "in_progress"
            ? "border-sky-500/45 bg-sky-500/10"
            : todo.status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : todo.status === "blocked"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-amber-900/25 bg-[#1c1610]"
        }`}
      >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold text-amber-50">
            {todo.title}
          </div>
          <div className="mt-0.5 text-[10px] leading-4 text-amber-200/55">
            {todo.description}
          </div>
        </div>
        <StatusPill status={todo.status} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {todo.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={todo.avatarUrl}
            alt=""
            className="h-5 w-5 rounded-full border border-white/10 object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="h-5 w-5 rounded-full bg-amber-500/30" />
        )}
        <div className="min-w-0 text-[10px] text-amber-100/80">
          <div className="truncate font-medium">
            {workAgentDisplayName(todo.agentKey)}
          </div>
          <div className="truncate font-mono text-[9px] text-amber-500/55">
            {todo.agentKey} · {todo.agentType}
          </div>
        </div>
      </div>
      {deps.length > 0 ? (
        <div className="mt-1.5 text-[9px] text-amber-500/50">
          وابسته به: {deps.join(" · ")}
        </div>
      ) : (
        <div className="mt-1.5 text-[9px] text-amber-500/40">بدون وابستگی</div>
      )}
      </button>
    </li>
  );
}

/**
 * Orchestrator todo board — status must match WorkTodo.status exactly.
 */
export const WorkTodosPanel = memo(function WorkTodosPanel({
  pipeline,
  open,
  onClose,
  onToggleRun,
  onStep,
  onReset,
  onTodoClick,
}: WorkTodosPanelProps) {
  if (!open) return null;

  const done = pipeline.todos.filter((t) => t.status === "completed").length;
  const total = pipeline.todos.length;

  return (
    <aside
      dir="rtl"
      className="pointer-events-auto absolute bottom-4 right-4 z-20 flex max-h-[min(70vh,560px)] w-[min(100%-2rem,340px)] flex-col overflow-hidden rounded-lg border border-amber-800/30 bg-[#120e08]/95 font-mono shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-amber-900/20 px-3 py-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/80">
            Orchestrator
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-amber-500/55">
            Todos · {done}/{total}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-amber-900/25 bg-[#1c1610] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200/85 transition hover:border-amber-500/40"
        >
          بستن
        </button>
      </div>

      <p className="border-b border-amber-900/15 px-3 py-2 text-[10px] leading-5 text-amber-200/60">
        {pipeline.goal}
      </p>

      <div className="flex flex-wrap gap-1.5 border-b border-amber-900/15 px-3 py-2">
        <button
          type="button"
          onClick={onToggleRun}
          className={`rounded-md border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider transition ${
            pipeline.running
              ? "border-sky-500/50 bg-sky-500/25 text-sky-200"
              : "border-amber-900/25 bg-[#1c1610] text-amber-200/85 hover:border-amber-500/40"
          }`}
        >
          {pipeline.running ? "توقف" : "اجرا"}
        </button>
        <button
          type="button"
          onClick={onStep}
          disabled={pipeline.running}
          className="rounded-md border border-amber-900/25 bg-[#1c1610] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200/85 transition hover:border-amber-500/40 disabled:opacity-40"
        >
          یک قدم
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-amber-900/25 bg-[#1c1610] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200/85 transition hover:border-amber-500/40"
        >
          ریست
        </button>
      </div>

      <ul className="space-y-2 overflow-y-auto p-3">
        {pipeline.todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            all={pipeline.todos}
            onClick={onTodoClick}
          />
        ))}
      </ul>
    </aside>
  );
});
