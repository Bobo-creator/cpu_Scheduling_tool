import { AlgorithmResult, Recommendation } from "./types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "First-Come, First-Served (FCFS)",
  SJF: "Shortest Job First (SJF)",
  SRTF: "Shortest Remaining Time First (SRTF)",
  RoundRobin: "Round Robin (RR)",
};

function scoreAlgorithm(results: AlgorithmResult[]): AlgorithmResult[] {
  const minWait = Math.min(...results.map((r) => r.avgWaitingTime));
  const minTurn = Math.min(...results.map((r) => r.avgTurnaroundTime));
  const minCS = Math.min(...results.map((r) => (r.contextSwitches > 0 ? r.contextSwitches : Infinity)));
  const maxUtil = Math.max(...results.map((r) => r.cpuUtilization));

  return results.map((result) => {
    const waitScore = minWait / result.avgWaitingTime;
    const turnScore = minTurn / result.avgTurnaroundTime;
    const csScore = result.contextSwitches === 0
      ? 1
      : minCS === Infinity
      ? 0
      : minCS / result.contextSwitches;
    const utilScore = maxUtil > 0 ? result.cpuUtilization / maxUtil : 0;

    const rawScore =
      waitScore * 0.35 +
      turnScore * 0.3 +
      utilScore * 0.2 +
      csScore * 0.15;

    return {
      ...result,
      score: Math.round(Math.max(0, Math.min(100, rawScore * 100))),
    };
  });
}

export function scoreResults(results: AlgorithmResult[]): AlgorithmResult[] {
  return scoreAlgorithm(results);
}

export function generateRecommendation(results: AlgorithmResult[]): Recommendation {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const second = sorted[1];

  let reasonText = `${ALGO_LABELS[best.algorithmName]} is the best fit for this workload. `;

  if (best.algorithmName === "FCFS") {
    reasonText += `It offers strong performance when processes arrive in a steady stream and have more consistent burst lengths. `;
  } else if (best.algorithmName === "SJF") {
    reasonText += `It minimizes waiting time by executing the smallest jobs first, which works well for workloads with short tasks. `;
  } else if (best.algorithmName === "SRTF") {
    reasonText += `It adapts dynamically to incoming processes by always running the job with the shortest remaining time, reducing waiting time in preemptive workloads. `;
  } else {
    reasonText += `It balances fairness and responsiveness by time-slicing across all ready processes, preventing long jobs from blocking the CPU. `;
  }

  reasonText += `It scored ${best.score}/100 based on wait time, turnaround time, context switching, and CPU utilization.`;

  if (second) {
    reasonText += ` Compared to ${ALGO_LABELS[second.algorithmName]}, it is ${Math.max(
      0,
      Math.round(best.score - second.score)
    )} points better in this analysis.`;
  }

  return {
    algorithmName: best.algorithmName,
    reasonText,
  };
}
