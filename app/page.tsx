"use client";

import { useState, useCallback } from "react";
import ProcessInputForm from "@/components/ProcessInputForm";
import GanttChart from "@/components/GanttChart";
import { simulate, AlgorithmType, SimulationOutput } from "@/lib/simulator";
import { Process } from "@/lib/types";

// ── Process color palette ──────────────────────────────────────────────────
const PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
];

function buildColorMap(output: SimulationOutput): Record<string, string> {
  const map: Record<string, string> = {};
  // Order by first appearance in Gantt so colors are stable
  let idx = 0;
  for (const step of output.steps) {
    if (step.processId && !(step.processId in map)) {
      map[step.processId] = PALETTE[idx % PALETTE.length];
      idx++;
    }
  }
  return map;
}

const ALGO_LABELS: Record<AlgorithmType, string> = {
  FCFS:        "First-Come First-Served",
  SJF:         "Shortest Job First",
  SRTF:        "Shortest Remaining Time First",
  RoundRobin:  "Round Robin",
};

// ── Component ─────────────────────────────────────────────────────────────
export default function Home() {
  const [simulation, setSimulation] = useState<SimulationOutput | null>(null);
  const [processColors, setProcessColors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [showAll, setShowAll] = useState(false);

  const handleVisualize = useCallback(
    (processes: Process[], algorithm: AlgorithmType, quantum: number) => {
      const result = simulate(processes, algorithm, quantum);
      setSimulation(result);
      setProcessColors(buildColorMap(result));
      setCurrentStep(-1);
      setShowAll(false);
    },
    []
  );

  // ── Step control handlers ──
  const handleStart   = () => setCurrentStep(0);
  const handleNext    = () =>
    setCurrentStep(c =>
      simulation && c < simulation.steps.length - 1 ? c + 1 : c
    );
  const handleShowAll = () => {
    if (!simulation) return;
    setCurrentStep(simulation.steps.length - 1);
    setShowAll(true);
  };
  const handleReset   = () => { setCurrentStep(-1); setShowAll(false); };

  // ── Derived display state ──
  const visibleUpTo = showAll && simulation
    ? simulation.steps.length - 1
    : currentStep;

  const currentStepData =
    simulation && currentStep >= 0 ? simulation.steps[currentStep] : null;

  const isDone =
    simulation !== null &&
    (showAll || currentStep === simulation.steps.length - 1);

  const canStart    = simulation !== null && currentStep < 0;
  const canNext     = simulation !== null && currentStep >= 0 &&
                      currentStep < simulation.steps.length - 1 && !showAll;
  const canShowAll  = simulation !== null && currentStep >= 0 && !showAll;
  const canReset    = simulation !== null && currentStep >= 0;

  // ── Remaining-time display ──
  // Show per-process remaining only for SRTF (and optionally RR)
  const showRemainingTracker =
    currentStepData !== null &&
    simulation !== null &&
    (simulation.algorithm === "SRTF" || simulation.algorithm === "RoundRobin");

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-indigo-400">CPU</span> Scheduling Visualizer
          </h1>
          <p className="text-slate-400 text-sm">
            Step-by-step visualization of FCFS, SJF, SRTF, and Round Robin
          </p>
        </header>

        {/* ── Two-column layout: form | visualization ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

          {/* Left – process input */}
          <ProcessInputForm onVisualize={handleVisualize} />

          {/* Right – Gantt + controls + explanation */}
          <div className="space-y-4">

            {/* Gantt chart card */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Gantt Chart
                </h2>
                {simulation && (
                  <span className="text-xs text-slate-500 font-mono">
                    {ALGO_LABELS[simulation.algorithm]}
                  </span>
                )}
              </div>

              {simulation ? (
                <GanttChart
                  steps={simulation.steps}
                  visibleUpTo={visibleUpTo}
                  currentStep={currentStep}
                  processColors={processColors}
                />
              ) : (
                <div className="h-20 flex items-center justify-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                  Configure processes and click&nbsp;
                  <span className="text-indigo-400 font-medium mx-1">Visualize</span>
                  &nbsp;to start
                </div>
              )}
            </div>

            {/* Step controls */}
            {simulation && (
              <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CtrlBtn onClick={handleStart}   disabled={!canStart}   accent>
                    Start
                  </CtrlBtn>
                  <CtrlBtn onClick={handleNext}    disabled={!canNext}>
                    Next Step
                  </CtrlBtn>
                  <CtrlBtn onClick={handleShowAll} disabled={!canShowAll}>
                    Show All
                  </CtrlBtn>
                  <CtrlBtn onClick={handleReset}   disabled={!canReset}>
                    Reset
                  </CtrlBtn>

                  {currentStep >= 0 && (
                    <span className="ml-auto text-xs text-slate-500 font-mono">
                      Step&nbsp;{currentStep + 1}&nbsp;/&nbsp;{simulation.steps.length}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step explanation + remaining time tracker */}
            {currentStepData && (
              <div className={`grid gap-4 ${showRemainingTracker ? "sm:grid-cols-2" : "grid-cols-1"}`}>

                {/* Explanation */}
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 space-y-3">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Step Explanation
                  </h2>

                  {/* Time range */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 text-xs uppercase tracking-wide">Time</span>
                    <span className="font-mono text-white">
                      t={currentStepData.startTime} → t={currentStepData.endTime}
                    </span>
                  </div>

                  {/* Running process badge */}
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs uppercase tracking-wide">Running</span>
                    {currentStepData.processId ? (
                      <span
                        className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          color: processColors[currentStepData.processId],
                          backgroundColor:
                            (processColors[currentStepData.processId] ?? "#6366f1") + "22",
                        }}
                      >
                        {currentStepData.processId}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-sm">idle</span>
                    )}
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentStepData.reason}
                  </p>
                </div>

                {/* Remaining time tracker (SRTF / RR) */}
                {showRemainingTracker && simulation && (
                  <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 space-y-3">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Remaining Times
                    </h2>
                    <div className="space-y-2.5">
                      {simulation.processResults.map(pr => {
                        const rem =
                          currentStepData.remainingBefore[pr.processId] ?? pr.burstTime;
                        const consumed = pr.burstTime - rem;
                        const pct =
                          pr.burstTime > 0
                            ? (consumed / pr.burstTime) * 100
                            : 100;
                        const color =
                          processColors[pr.processId] ?? "#6366f1";
                        const isRunning =
                          currentStepData.processId === pr.processId;
                        const isDoneP = rem === 0;

                        return (
                          <div key={pr.processId}>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-semibold ${
                                  isRunning ? "text-white" : "text-slate-400"
                                }`}
                                style={isRunning ? { color } : undefined}
                              >
                                {pr.processId}
                                {isRunning && (
                                  <span className="ml-1.5 text-[10px] opacity-70">
                                    ▶
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-xs font-mono tabular-nums ${
                                  isDoneP ? "text-slate-600 line-through" : "text-slate-400"
                                }`}
                              >
                                {rem}/{pr.burstTime}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: isDoneP ? "#334155" : color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Results table (appears when simulation finishes) ── */}
        {isDone && simulation && (
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Results — {ALGO_LABELS[simulation.algorithm]}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-6">PID</th>
                    <th className="text-right py-2 px-4">Arrival</th>
                    <th className="text-right py-2 px-4">Burst</th>
                    <th className="text-right py-2 px-4">Finish</th>
                    <th className="text-right py-2 px-4">Wait Time</th>
                    <th className="text-right py-2 px-4">Turnaround</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {simulation.processResults.map(p => (
                    <tr
                      key={p.processId}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-3 pr-6">
                        <span
                          className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            color: processColors[p.processId],
                            backgroundColor:
                              (processColors[p.processId] ?? "#6366f1") + "22",
                          }}
                        >
                          {p.processId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {p.arrivalTime}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {p.burstTime}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {p.completionTime}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {p.waitingTime}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {p.turnaroundTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary metrics */}
            <div className="mt-5 pt-4 border-t border-slate-700 flex flex-wrap gap-8">
              <Metric label="Avg Wait Time"   value={simulation.avgWaitingTime} />
              <Metric label="Avg Turnaround"  value={simulation.avgTurnaroundTime} />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-slate-700 pb-4">
          CPU Scheduling Visualizer — Operating Systems Class Project
        </footer>
      </div>
    </main>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────

function CtrlBtn({
  children,
  onClick,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        accent
          ? "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white"
          : "bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-bold text-indigo-400 tabular-nums">{value}</span>
    </div>
  );
}
