"use client";

import { Recommendation } from "@/lib/types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "First-Come, First-Served (FCFS)",
  SJF: "Shortest Job First (SJF)",
  SRTF: "Shortest Remaining Time First (SRTF)",
  RoundRobin: "Round Robin (RR)",
};

interface Props {
  recommendation: Recommendation;
  explanation?: string;
}

export default function RecommendationPanel({ recommendation, explanation }: Props) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 text-2xl">
            👑
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Best Algorithm
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {ALGO_LABELS[recommendation.algorithmName] ?? recommendation.algorithmName}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-300 leading-relaxed">{recommendation.reasonText}</p>
          {explanation ? (
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">
                Claude AI explanation
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
