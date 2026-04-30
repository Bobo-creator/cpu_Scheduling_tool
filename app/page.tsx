"use client";

import { useState, useCallback, useMemo } from "react";
import ProcessInputForm from "@/components/ProcessInputForm";
import RecommendationPanel from "@/components/RecommendationPanel";
import ComparisonTable from "@/components/ComparisonTable";
import GanttChart from "@/components/GanttChart";
import { simulate, AlgorithmType, SimulationOutput } from "@/lib/simulator";
import { Process, AlgorithmResult, Recommendation } from "@/lib/types";

const PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
];

function buildColorMap(output: SimulationOutput): Record<string, string> {
  const map: Record<string, string> = {};
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
  FCFS: "First-Come First-Served",
  SJF: "Shortest Job First",
  SRTF: "Shortest Remaining Time First",
  RoundRobin: "Round Robin",
};

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<AlgorithmResult[] | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [quantum, setQuantum] = useState(2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"recommendation" | "visualizer">("recommendation");

  const [simulation, setSimulation] = useState<SimulationOutput | null>(null);
  const [processColors, setProcessColors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(-1);
  const [showAll, setShowAll] = useState(false);

  const handleAnalyze = useCallback(async (processes: Process[], quantum: number) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setProcesses(processes);
    setQuantum(quantum);
    setViewMode("recommendation");
    setSimulation(null);
    setCurrentStep(-1);
    setShowAll(false);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processes, quantum }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to analyze processes.");
      }

      setAnalysisResults(data.results);
      setRecommendation(data.recommendation);
      setAiExplanation(data.aiExplanation || "");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : String(error));
      setAnalysisResults(null);
      setRecommendation(null);
      setAiExplanation("");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleVisualizeRecommendation = useCallback(() => {
    if (!recommendation || processes.length === 0) return;

    const algorithm = recommendation.algorithmName as AlgorithmType;
    const result = simulate(processes, algorithm, quantum);

    setSimulation(result);
    setProcessColors(buildColorMap(result));
    setCurrentStep(-1);
    setShowAll(false);
    setViewMode("visualizer");
  }, [processes, quantum, recommendation]);

  const handleBackToRecommendation = () => setViewMode("recommendation");

  const visibleUpTo = showAll && simulation ? simulation.steps.length - 1 : currentStep;
  const currentStepData = simulation && currentStep >= 0 ? simulation.steps[currentStep] : null;
  const isDone = simulation !== null && (showAll || currentStep === simulation.steps.length - 1);
  const canStart = simulation !== null && currentStep < 0;
  const canNext = simulation !== null && currentStep >= 0 && currentStep < simulation.steps.length - 1 && !showAll;
  const canShowAll = simulation !== null && currentStep >= 0 && !showAll;
  const canReset = simulation !== null && currentStep >= 0;

  const rankingResults = useMemo(() => {
    if (!analysisResults) return [];
    return [...analysisResults].sort((a, b) => b.score - a.score);
  }, [analysisResults]);

  const maxWait = useMemo(
    () => (analysisResults ? Math.max(...analysisResults.map((r) => r.avgWaitingTime)) : 0),
    [analysisResults]
  );

  const maxTurn = useMemo(
    () => (analysisResults ? Math.max(...analysisResults.map((r) => r.avgTurnaroundTime)) : 0),
    [analysisResults]
  );

  const showRemainingTracker =
    currentStepData !== null &&
    simulation !== null &&
    (simulation.algorithm === "SRTF" || simulation.algorithm === "RoundRobin");

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            Algorithm Recommendation Engine
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Find the best CPU scheduling algorithm for your workload.
            </h1>
            <p className="mx-auto max-w-2xl text-slate-400 sm:text-lg">
              Analyze arrival and burst times, compare FCFS, SJF, SRTF, and Round Robin, then visualize the recommended algorithm in action.
            </p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <ProcessInputForm onAnalyze={handleAnalyze} />

          <div className="space-y-6">
            {isAnalyzing ? (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
                <p className="text-sm text-slate-400">Analyzing processes across all scheduling algorithms...</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-1/3 animate-pulse bg-indigo-500/80" />
                </div>
              </div>
            ) : analysisError ? (
              <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 text-rose-200">
                <p className="font-semibold">Analysis failed</p>
                <p className="mt-2 text-sm text-slate-300">{analysisError}</p>
              </div>
            ) : recommendation && analysisResults ? (
              <div className="space-y-6">
                <RecommendationPanel recommendation={recommendation} explanation={aiExplanation} />

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                  <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">
                      Algorithm Score Ranking
                    </h2>
                    <div className="space-y-4">
                      {rankingResults.map((result) => (
                        <div key={result.algorithmName} className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <span>{ALGO_LABELS[result.algorithmName]}</span>
                            <span className="font-semibold text-white">{result.score}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">
                      Wait / Turnaround Comparison
                    </h2>
                    <div className="space-y-4">
                      {rankingResults.map((result) => {
                        const waitWidth = maxWait > 0 ? (result.avgWaitingTime / maxWait) * 100 : 0;
                        const turnWidth = maxTurn > 0 ? (result.avgTurnaroundTime / maxTurn) * 100 : 0;
                        return (
                          <div key={result.algorithmName} className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span>{ALGO_LABELS[result.algorithmName]}</span>
                              <span className="text-slate-400">{result.avgWaitingTime} / {result.avgTurnaroundTime} ms</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Avg Wait</div>
                              <div className="h-2 rounded-full bg-slate-800">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${waitWidth}%` }} />
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Avg Turnaround</div>
                              <div className="h-2 rounded-full bg-slate-800">
                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${turnWidth}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Comparison Table</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">All Algorithms at a Glance</h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleVisualizeRecommendation}
                      className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                    >
                      Visualize Recommended Algorithm
                    </button>
                  </div>
                  <div className="mt-6">
                    <ComparisonTable
                      results={analysisResults}
                      bestAlgorithmName={recommendation.algorithmName as AlgorithmType}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
                <p className="text-slate-400">Enter the process list and press Analyze to generate a recommendation and comparison view.</p>
              </div>
            )}
          </div>
        </div>

        {viewMode === "visualizer" && simulation && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-white">Visualization</h2>
                <p className="text-sm text-slate-400">Showing the recommended algorithm: {ALGO_LABELS[simulation.algorithm]}</p>
              </div>
              <button
                type="button"
                onClick={handleBackToRecommendation}
                className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                ← Back to Recommendation
              </button>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Gantt Chart</p>
                  <p className="text-sm text-slate-400">{ALGO_LABELS[simulation.algorithm]}</p>
                </div>
                <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Step {currentStep + 1} / {simulation.steps.length}</div>
              </div>
              <GanttChart
                steps={simulation.steps}
                visibleUpTo={visibleUpTo}
                currentStep={currentStep}
                processColors={processColors}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    disabled={!canStart}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${canStart ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-800 text-slate-500"}`}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep((c) => (simulation && c < simulation.steps.length - 1 ? c + 1 : c))}
                    disabled={!canNext}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${canNext ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-800 text-slate-500"}`}
                  >
                    Next Step
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!simulation) return;
                      setCurrentStep(simulation.steps.length - 1);
                      setShowAll(true);
                    }}
                    disabled={!canShowAll}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${canShowAll ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-800 text-slate-500"}`}
                  >
                    Show All
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(-1); setShowAll(false); }}
                    disabled={!canReset}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${canReset ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-800 text-slate-500"}`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
                {currentStepData ? (
                  <>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                      <span>Time window</span>
                      <span>{currentStepData.startTime} → {currentStepData.endTime}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{currentStepData.reason}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Use the controls to step through the recommended schedule.</p>
                )}
              </div>
            </div>

            {currentStepData && showRemainingTracker && (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-4">Remaining Time Tracker</h3>
                <div className="space-y-4">
                  {simulation.processResults.map((pr) => {
                    const rem = currentStepData.remainingBefore[pr.processId] ?? pr.burstTime;
                    const consumed = pr.burstTime - rem;
                    const pct = pr.burstTime > 0 ? (consumed / pr.burstTime) * 100 : 100;
                    const color = processColors[pr.processId] ?? "#6366f1";
                    const isRunning = currentStepData.processId === pr.processId;
                    const isDoneP = rem === 0;

                    return (
                      <div key={pr.processId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${isRunning ? "text-white" : "text-slate-400"}`} style={isRunning ? { color } : undefined}>
                            {pr.processId}
                            {isRunning && <span className="ml-1.5 text-[10px] opacity-70">▶</span>}
                          </span>
                          <span className={`text-xs font-mono tabular-nums ${isDoneP ? "text-slate-600 line-through" : "text-slate-400"}`}>
                            {rem}/{pr.burstTime}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: isDoneP ? "#334155" : color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isDone && simulation && (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-white mb-4">Simulation Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-200">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-[0.24em]">
                        <th className="text-left py-2 pr-6">PID</th>
                        <th className="text-right py-2 px-4">Arrival</th>
                        <th className="text-right py-2 px-4">Burst</th>
                        <th className="text-right py-2 px-4">Finish</th>
                        <th className="text-right py-2 px-4">Wait</th>
                        <th className="text-right py-2 px-4">Turnaround</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {simulation.processResults.map((p) => (
                        <tr key={p.processId} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 pr-6 text-slate-100">{p.processId}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-300">{p.arrivalTime}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-300">{p.burstTime}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-300">{p.completionTime}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-300">{p.waitingTime}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-300">{p.turnaroundTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700 flex flex-wrap gap-8">
                  <Metric label="Avg Wait Time" value={simulation.avgWaitingTime} />
                  <Metric label="Avg Turnaround" value={simulation.avgTurnaroundTime} />
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="text-center text-xs text-slate-600 pb-4">
          CPU Scheduling Recommendation Engine — Operating Systems Class Project
        </footer>
      </div>
    </main>
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
