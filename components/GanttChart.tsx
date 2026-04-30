"use client";

import { SimStep } from "@/lib/simulator";

interface Props {
  steps: SimStep[];
  /** Index of the last visible step (-1 = nothing shown yet) */
  visibleUpTo: number;
  /** Index of the currently highlighted step */
  currentStep: number;
  processColors: Record<string, string>;
}

const IDLE_COLOR = "#334155";

export default function GanttChart({
  steps,
  visibleUpTo,
  currentStep,
  processColors,
}: Props) {
  if (steps.length === 0) return null;

  const totalTime = steps[steps.length - 1].endTime;
  const startTime = steps[0].startTime;
  const timeSpan = totalTime - startTime;
  if (timeSpan === 0) return null;

  return (
    <div className="space-y-2">
      {/* ── Gantt bars ── */}
      <div className="relative h-14 bg-slate-800 rounded-lg overflow-hidden flex">
        {steps.map((step, i) => {
          const widthPct = ((step.endTime - step.startTime) / timeSpan) * 100;
          const isVisible = visibleUpTo >= 0 && i <= visibleUpTo;
          const isCurrent = i === currentStep;
          const color = step.processId
            ? (processColors[step.processId] ?? "#6366f1")
            : IDLE_COLOR;

          return (
            <div
              key={i}
              className="relative h-full flex items-center justify-center select-none transition-all duration-300"
              style={{
                width: `${widthPct}%`,
                flexShrink: 0,
                backgroundColor: isVisible ? color : "transparent",
                borderRight: "2px solid #0f172a",
                /* ghost outline for not-yet-revealed segments */
                outline: !isVisible
                  ? "1px dashed rgba(100,116,139,0.25)"
                  : "none",
                boxShadow: isCurrent && isVisible
                  ? `inset 0 0 0 2px rgba(255,255,255,0.45), 0 0 14px ${color}88`
                  : "none",
              }}
            >
              {isVisible && widthPct > 5 && (
                <span className="text-white text-xs font-bold drop-shadow truncate px-1">
                  {step.processId ?? "idle"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Time axis ── */}
      <div className="relative flex h-5">
        {steps.map((step, i) => {
          const widthPct =
            ((step.endTime - step.startTime) / timeSpan) * 100;
          const showLabel = widthPct >= 4; // skip labels for very narrow blocks
          return (
            <div
              key={i}
              className="relative flex-shrink-0"
              style={{ width: `${widthPct}%` }}
            >
              {showLabel && (
                <span
                  className="absolute left-0 top-0 text-[10px] text-slate-500 font-mono leading-none"
                  style={{ transform: "translateX(-50%)" }}
                >
                  {step.startTime}
                </span>
              )}
              {/* tick */}
              <div
                className="absolute left-0 top-0 w-px h-2 bg-slate-600"
                style={{ transform: "translateX(-0.5px)" }}
              />
            </div>
          );
        })}
        {/* Final end-time label */}
        <span className="absolute right-0 top-0 text-[10px] text-slate-500 font-mono leading-none">
          {totalTime}
        </span>
        <div className="absolute right-0 top-0 w-px h-2 bg-slate-600" />
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {Object.entries(processColors).map(([pid, color]) => (
          <span key={pid} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {pid}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: IDLE_COLOR }}
          />
          idle
        </span>
      </div>
    </div>
  );
}
