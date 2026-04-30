"use client";

import { AlgorithmResult } from "@/lib/types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "FCFS",
  SJF: "SJF",
  SRTF: "SRTF",
  RoundRobin: "Round Robin",
};

interface Props {
  results: AlgorithmResult[];
  bestAlgorithmName: string;
}

export default function ComparisonTable({ results, bestAlgorithmName }: Props) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-xl">
        <table className="w-full text-sm text-slate-200">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="text-left px-5 py-3 font-semibold">Algorithm</th>
              <th className="text-right px-5 py-3 font-semibold">Avg Wait</th>
              <th className="text-right px-5 py-3 font-semibold">Avg Turnaround</th>
              <th className="text-right px-5 py-3 font-semibold">Context Switches</th>
              <th className="text-right px-5 py-3 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isBest = r.algorithmName === bestAlgorithmName;
              return (
                <tr
                  key={r.algorithmName}
                  className={isBest ? "bg-indigo-950/70 border-l-4 border-indigo-400" : "border-b border-slate-800"}
                >
                  <td className="px-5 py-3 font-medium text-slate-100">
                    {ALGO_LABELS[r.algorithmName]}
                    {isBest && (
                      <span className="ml-2 text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        Best
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-200">{r.avgWaitingTime} ms</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-200">{r.avgTurnaroundTime} ms</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-200">{r.contextSwitches}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-indigo-300 font-semibold">{r.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {results.map((r) => {
          const isBest = r.algorithmName === bestAlgorithmName;
          return (
            <div
              key={r.algorithmName}
              className={`rounded-3xl border p-4 shadow-sm ${
                isBest ? "border-indigo-500/30 bg-slate-950" : "border-slate-700 bg-slate-900"
              }`}
            >
              <h3 className={`font-semibold mb-3 text-sm ${isBest ? "text-white" : "text-slate-300"}`}>
                {ALGO_LABELS[r.algorithmName]} — Per Process
              </h3>
              <div className="space-y-2 text-xs text-slate-400">
                {r.perProcessResults.map((p) => (
                  <div key={p.processId} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 py-1 border-b border-slate-800 last:border-b-0">
                    <span className="font-medium text-slate-100">{p.processId}</span>
                    <span className="text-right">{p.waitingTime}</span>
                    <span className="text-right">{p.turnaroundTime}</span>
                    <span className="text-right">{p.completionTime}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
