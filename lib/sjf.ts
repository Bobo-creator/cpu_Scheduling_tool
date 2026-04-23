import { Process, ProcessResult } from "./types";

export function runSJF(processes: Process[]): ProcessResult[] {
  const remaining = processes.map((p) => ({ ...p }));
  const results: ProcessResult[] = [];
  let currentTime = 0;
  let completed = 0;
  const n = remaining.length;

  while (completed < n) {
    // Find all processes that have arrived and not yet completed
    const available = remaining.filter(
      (p) => p.arrivalTime <= currentTime && !results.find((r) => r.processId === p.processId)
    );

    if (available.length === 0) {
      // CPU idle — jump to next arrival
      const nextArrival = remaining
        .filter((p) => !results.find((r) => r.processId === p.processId))
        .reduce((min, p) => Math.min(min, p.arrivalTime), Infinity);
      currentTime = nextArrival;
      continue;
    }

    // Select shortest burst; tie-break by arrival time, then processId
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.processId.localeCompare(b.processId);
    });

    const p = available[0];
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
    completed++;
  }

  return results;
}
