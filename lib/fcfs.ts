import { Process, ProcessResult } from "./types";

export function runFCFS(processes: Process[]): ProcessResult[] {
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.processId.localeCompare(b.processId)
  );

  let currentTime = 0;
  const results: ProcessResult[] = [];

  for (const p of sorted) {
    if (currentTime < p.arrivalTime) {
      currentTime = p.arrivalTime;
    }
    const completionTime = currentTime + p.burstTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;

    results.push({
      ...p,
      completionTime,
      turnaroundTime,
      waitingTime,
    });

    currentTime = completionTime;
  }

  return results;
}
