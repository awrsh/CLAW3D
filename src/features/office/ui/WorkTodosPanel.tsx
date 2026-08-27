"use client";

import { memo, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  statusColor,
  statusLabelFa,
  workAgentDisplayName,
  type WorkPipeline,
  type WorkTodo,
  type WorkTodoStatus,
} from "@/features/office/core/workTodos";
import {
  GhostButton,
  PanelShell,
} from "@/features/office/ui/studioControls";

type WorkTodosPanelProps = {
  pipeline: WorkPipeline;
  open: boolean;
  onClose: () => void;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onTodoClick?: (todo: WorkTodo) => void;
  /** Build a new pipeline from free-text and optionally auto-run. */
  onSubmitGoal?: (goal: string) => void;
};

const GOAL_HINTS = [
  "تحلیل دیتا فروش و ساخت داشبورد",
  "شرح شغل فول‌استک و پلن آموزش و صفحه شغلی",
  "تعریف محصول و API بک‌اند برای اپ داخلی",
];

function StatusPill({ status }: { status: WorkTodoStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide"
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
        className={`w-full rounded-lg border px-2.5 py-2 text-right transition hover:brightness-110 ${
          todo.status === "in_progress"
            ? "border-sky-500/45 bg-sky-500/10"
            : todo.status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : todo.status === "blocked"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-amber-900/25 bg-[#1c1610]/80"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold text-amber-50">
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
  onSubmitGoal,
}: WorkTodosPanelProps) {
  const [draft, setDraft] = useState("");

  if (!open) return null;

  const done = pipeline.todos.filter((t) => t.status === "completed").length;
  const total = pipeline.todos.length;
  const busy = pipeline.running;

  const submitGoal = () => {
    const trimmed = draft.trim();
    if (!trimmed || !onSubmitGoal || busy) return;
    onSubmitGoal(trimmed);
    setDraft("");
  };

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitGoal();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submitGoal();
  };

  return (
    <PanelShell
      title="Orchestrator"
      subtitle={`Todos · ${done}/${total}`}
      className="absolute bottom-4 right-4 z-20 max-h-[min(78vh,640px)] w-[min(100%-2rem,360px)]"
      actions={<GhostButton onClick={onClose}>بستن</GhostButton>}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <form
        onSubmit={onFormSubmit}
        className="space-y-2 border-b border-amber-900/15 px-3 py-2.5"
      >
        <label className="block text-[10px] font-medium text-amber-500/65">
          هدف خودت را بنویس — نقش‌ها خودکار انتخاب می‌شوند
        </label>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          disabled={busy}
          placeholder="مثال: تحلیل دیتا فروش و ساخت داشبورد وب…"
          className="w-full resize-none rounded-lg border border-amber-900/25 bg-[#0e0b07]/80 px-2.5 py-2 text-[12px] leading-5 text-amber-50 outline-none placeholder:text-amber-500/35 focus:border-amber-500/45 disabled:opacity-50"
        />
        <div className="flex flex-wrap gap-1">
          {GOAL_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              disabled={busy}
              onClick={() => setDraft(hint)}
              className="rounded-md border border-amber-900/20 bg-[#1c1610]/70 px-2 py-1 text-[9px] text-amber-200/60 transition hover:border-amber-500/30 hover:text-amber-100 disabled:opacity-40"
            >
              {hint.length > 28 ? `${hint.slice(0, 27)}…` : hint}
            </button>
          ))}
        </div>
        <GhostButton
          type="submit"
          className="w-full"
          disabled={!draft.trim() || busy || !onSubmitGoal}
          active={Boolean(draft.trim()) && !busy}
        >
          ساخت و اجرا
        </GhostButton>
      </form>

      <p className="border-b border-amber-900/15 px-3 py-2 text-[10px] leading-5 text-amber-200/60">
        {pipeline.goal}
      </p>

      <div className="flex flex-wrap gap-1.5 border-b border-amber-900/15 px-3 py-2">
        <GhostButton
          active={pipeline.running}
          onClick={onToggleRun}
          className={
            pipeline.running
              ? "border-sky-500/50 bg-sky-500/25 text-sky-200"
              : undefined
          }
        >
          {pipeline.running ? "توقف" : "اجرا"}
        </GhostButton>
        <GhostButton onClick={onStep} disabled={pipeline.running}>
          یک قدم
        </GhostButton>
        <GhostButton onClick={onReset}>ریست</GhostButton>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {pipeline.todos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            all={pipeline.todos}
            onClick={onTodoClick}
          />
        ))}
      </ul>
    </PanelShell>
  );
});
