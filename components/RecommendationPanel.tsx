"use client";

import { Recommendation } from "@/lib/types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "First-Come, First-Served (FCFS)",
  SJF: "Shortest Job First (SJF)",
  RoundRobin: "Round Robin (RR)",
};

interface Props {
  recommendation: Recommendation;
}

export default function RecommendationPanel({ recommendation }: Props) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-300 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-amber-500 text-xl mt-0.5">★</div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
            Recommendation
          </p>
          <p className="font-bold text-slate-800 text-base">
            {ALGO_LABELS[recommendation.algorithmName] ?? recommendation.algorithmName}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{recommendation.reasonText}</p>
        </div>
      </div>
    </div>
  );
}
