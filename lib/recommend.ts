import { AlgorithmResult, Recommendation } from "./types";

const ALGO_LABELS: Record<string, string> = {
  FCFS: "First-Come, First-Served (FCFS)",
  SJF: "Shortest Job First (SJF)",
  RoundRobin: "Round Robin (RR)",
};

export function generateRecommendation(results: AlgorithmResult[]): Recommendation {
  // Primary criterion: lowest average waiting time
  const best = results.reduce((prev, curr) =>
    curr.avgWaitingTime < prev.avgWaitingTime ? curr : prev
  );

  const sorted = [...results].sort((a, b) => a.avgWaitingTime - b.avgWaitingTime);
  const second = sorted[1];
  const improvement = (
    ((second.avgWaitingTime - best.avgWaitingTime) / second.avgWaitingTime) *
    100
  ).toFixed(1);

  let reasonText = `${ALGO_LABELS[best.algorithmName]} performs best for this workload. `;

  if (best.algorithmName === "FCFS") {
    reasonText +=
      `It achieves the lowest average waiting time (${best.avgWaitingTime} ms). ` +
      `FCFS works well when processes have similar burst times or arrive in a favorable order, ` +
      `minimising scheduling overhead.`;
  } else if (best.algorithmName === "SJF") {
    reasonText +=
      `It achieves the lowest average waiting time (${best.avgWaitingTime} ms), ` +
      `${improvement}% better than the next best algorithm. ` +
      `SJF minimises waiting time by always executing the shortest available job next. ` +
      `Consider Round Robin if fairness across long-running processes is a concern.`;
  } else {
    reasonText +=
      `It achieves the lowest average waiting time (${best.avgWaitingTime} ms). ` +
      `Round Robin's time-slicing ensures fair CPU access and prevents starvation, ` +
      `which benefits this particular process mix. Adjusting the quantum may improve performance further.`;
  }

  return {
    algorithmName: best.algorithmName,
    reasonText,
  };
}
