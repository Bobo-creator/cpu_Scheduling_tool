"use client";

import { AlgorithmResult } from "@/lib/types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "FCFS",
  SJF: "SJF",
  RoundRobin: "Round Robin",
};

interface Props {
  results: AlgorithmResult[];
  bestAlgorithmName: string;
}

export default function ComparisonTable({ results, bestAlgorithmName }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary comparison table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left px-5 py-3 font-semibold">Algorithm</th>
              <th className="text-right px-5 py-3 font-semibold">Avg Wait Time</th>
              <th className="text-right px-5 py-3 font-semibold">Avg Turnaround</th>
              <th className="text-right px-5 py-3 font-semibold">CPU Utilization</th>
              <th className="text-right px-5 py-3 font-semibold">Throughput</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const isBest = r.algorithmName === bestAlgorithmName;
              return (
                <tr
                  key={r.algorithmName}
                  className={
                    isBest
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : i % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50"
                  }
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {ALGO_LABELS[r.algorithmName]}
                    {isBest && (
                      <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Best
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {r.avgWaitingTime} ms
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {r.avgTurnaroundTime} ms
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {r.cpuUtilization}%
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {r.throughput} p/ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-algorithm process breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        {results.map((r) => {
          const isBest = r.algorithmName === bestAlgorithmName;
          return (
            <div
              key={r.algorithmName}
              className={`rounded-xl border p-4 shadow-sm ${
                isBest ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <h3 className={`font-semibold mb-3 text-sm ${isBest ? "text-emerald-800" : "text-slate-700"}`}>
                {ALGO_LABELS[r.algorithmName]} — Per Process
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="text-left pb-1 font-medium">PID</th>
                    <th className="text-right pb-1 font-medium">Wait</th>
                    <th className="text-right pb-1 font-medium">TAT</th>
                    <th className="text-right pb-1 font-medium">Finish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.perProcessResults.map((p) => (
                    <tr key={p.processId}>
                      <td className="py-1 text-slate-700 font-medium">{p.processId}</td>
                      <td className="py-1 text-right tabular-nums text-slate-600">{p.waitingTime}</td>
                      <td className="py-1 text-right tabular-nums text-slate-600">{p.turnaroundTime}</td>
                      <td className="py-1 text-right tabular-nums text-slate-600">{p.completionTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
