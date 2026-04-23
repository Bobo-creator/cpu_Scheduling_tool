"use client";

import { useState } from "react";
import ProcessInputForm, { ProcessRow } from "@/components/ProcessInputForm";
import ComparisonTable from "@/components/ComparisonTable";
import RecommendationPanel from "@/components/RecommendationPanel";
import { ComparisonOutput } from "@/lib/types";

export default function Home() {
  const [result, setResult] = useState<ComparisonOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (rows: ProcessRow[], quantum: number) => {
    setLoading(true);
    setApiError(null);
    setResult(null);

    const processes = rows.map((r) => ({
      processId: r.processId.trim(),
      arrivalTime: parseInt(r.arrivalTime),
      burstTime: parseInt(r.burstTime),
    }));

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processes, quantum }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "An unexpected error occurred.");
      } else {
        setResult(data as ComparisonOutput);
        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            CPU Scheduling Efficiency Tool
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Enter your process set and compare{" "}
            <span className="font-medium text-slate-700">FCFS</span>,{" "}
            <span className="font-medium text-slate-700">SJF</span>, and{" "}
            <span className="font-medium text-slate-700">Round Robin</span> scheduling
            algorithms side-by-side.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Process Input</h2>
          <ProcessInputForm onSubmit={handleSubmit} loading={loading} />

          {apiError && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{apiError}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div id="results" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Results</h2>
            <RecommendationPanel recommendation={result.recommendation} />
            <ComparisonTable
              results={result.results}
              bestAlgorithmName={result.recommendation.algorithmName}
            />
          </div>
        )}

        <footer className="text-center text-xs text-slate-400 pb-4">
          CPU Scheduling Efficiency Tool — Operating Systems Class Project
        </footer>
      </div>
    </main>
  );
}
