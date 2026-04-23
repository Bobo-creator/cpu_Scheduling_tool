import { NextRequest, NextResponse } from "next/server";
import { runFCFS } from "@/lib/fcfs";
import { runSJF } from "@/lib/sjf";
import { runRoundRobin } from "@/lib/roundRobin";
import { calculateMetrics } from "@/lib/metrics";
import { generateRecommendation } from "@/lib/recommend";
import { Process } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: { processes: Process[]; quantum?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { processes, quantum = 2 } = body;

  // --- Input Validation ---
  if (!Array.isArray(processes) || processes.length === 0) {
    return NextResponse.json(
      { error: "processes must be a non-empty array." },
      { status: 400 }
    );
  }

  for (const p of processes) {
    if (!p.processId || typeof p.processId !== "string" || p.processId.trim() === "") {
      return NextResponse.json({ error: `Each process must have a non-empty processId.` }, { status: 400 });
    }
    if (typeof p.arrivalTime !== "number" || !Number.isInteger(p.arrivalTime) || p.arrivalTime < 0) {
      return NextResponse.json(
        { error: `Process ${p.processId}: arrivalTime must be a non-negative integer.` },
        { status: 400 }
      );
    }
    if (typeof p.burstTime !== "number" || !Number.isInteger(p.burstTime) || p.burstTime <= 0) {
      return NextResponse.json(
        { error: `Process ${p.processId}: burstTime must be a positive integer.` },
        { status: 400 }
      );
    }
  }

  // Check duplicate process IDs
  const ids = processes.map((p) => p.processId);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Process IDs must be unique." }, { status: 400 });
  }

  if (!Number.isInteger(quantum) || quantum < 1) {
    return NextResponse.json({ error: "quantum must be a positive integer." }, { status: 400 });
  }

  // --- Run Algorithms ---
  const fcfsResults = runFCFS(processes);
  const sjfResults = runSJF(processes);
  const rrResults = runRoundRobin(processes, quantum);

  // --- Compute Metrics ---
  const fcfsMetrics = calculateMetrics("FCFS", fcfsResults);
  const sjfMetrics = calculateMetrics("SJF", sjfResults);
  const rrMetrics = calculateMetrics("RoundRobin", rrResults);

  const results = [fcfsMetrics, sjfMetrics, rrMetrics];

  // --- Recommendation ---
  const recommendation = generateRecommendation(results);

  return NextResponse.json({ results, recommendation });
}
