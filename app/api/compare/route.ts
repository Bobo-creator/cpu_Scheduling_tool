import { NextRequest, NextResponse } from "next/server";
import { simulate } from "@/lib/simulator";
import { calculateMetrics } from "@/lib/metrics";
import { generateRecommendation, scoreResults } from "@/lib/recommend";
import { Process } from "@/lib/types";

function countContextSwitches(steps: { processId: string | null }[]) {
  let switches = 0;
  let lastPid: string | null = null;

  for (const step of steps) {
    if (step.processId === null) continue;
    if (lastPid !== null && step.processId !== lastPid) {
      switches += 1;
    }
    lastPid = step.processId;
  }

  return switches;
}

function buildPrompt(
  processes: Process[],
  results: { algorithmName: string; avgWaitingTime: number; avgTurnaroundTime: number; contextSwitches: number; cpuUtilization: number; throughput: number; score: number; }[],
  recommendationAlgorithm: string
) {
  const processTable = processes
    .map((p) => `${p.processId} | ${p.arrivalTime} | ${p.burstTime}`)
    .join("\n");

  const metricsTable = results
    .map(
      (r) =>
        `${r.algorithmName} | wait=${r.avgWaitingTime} | turnaround=${r.avgTurnaroundTime} | switches=${r.contextSwitches} | util=${r.cpuUtilization}% | throughput=${r.throughput} | score=${r.score}`
    )
    .join("\n");

  return `You are an expert operating systems assistant. A user has submitted a CPU scheduling workload and a rule-based analysis has already been computed.

Workload:
PID | Arrival | Burst
${processTable}

Algorithm metrics:
Algorithm | Avg Wait | Avg Turnaround | Context Switches | CPU Utilization | Throughput | Score
${metricsTable}

Recommendation: ${recommendationAlgorithm}

Please explain in plain English:
- Which algorithm is the best choice for this specific input and why
- Any tradeoffs that matter for this workload
- What kind of workload profile this input represents

Provide a concise helpful summary with enough detail for a student or developer to understand the decision.`;
}

async function getAiExplanation(
  processes: Process[],
  results: { algorithmName: string; avgWaitingTime: number; avgTurnaroundTime: number; contextSwitches: number; cpuUtilization: number; throughput: number; score: number; }[],
  recommendationAlgorithm: string
) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return "";

  const prompt = buildPrompt(processes, results, recommendationAlgorithm);

  try {
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        temperature: 0.2,
        prompt,
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    return data?.completion ? String(data.completion).trim() : "";
  } catch {
    return "";
  }
}

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

  const ids = processes.map((p) => p.processId);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Process IDs must be unique." }, { status: 400 });
  }

  if (!Number.isInteger(quantum) || quantum < 1) {
    return NextResponse.json({ error: "quantum must be a positive integer." }, { status: 400 });
  }

  const algorithms = [
    simulate(processes, "FCFS"),
    simulate(processes, "SJF"),
    simulate(processes, "SRTF"),
    simulate(processes, "RoundRobin", quantum),
  ];

  const results = algorithms.map((simulation) =>
    calculateMetrics(
      simulation.algorithm,
      simulation.processResults,
      countContextSwitches(simulation.steps)
    )
  );

  const scoredResults = scoreResults(results);
  const recommendation = generateRecommendation(scoredResults);
  const aiExplanation = await getAiExplanation(processes, scoredResults, recommendation.algorithmName);

  return NextResponse.json({ results: scoredResults, recommendation, aiExplanation });
}
