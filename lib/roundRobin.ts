import { Process, ProcessResult } from "./types";

export function runRoundRobin(processes: Process[], quantum: number = 2): ProcessResult[] {
  const n = processes.length;
  const remaining = processes.map((p) => ({ ...p, remainingBurst: p.burstTime }));
  const completionTimes: Record<string, number> = {};
  const queue: typeof remaining = [];
  const inQueue = new Set<string>();

  let currentTime = 0;
  let completed = 0;

  // Sort by arrival time initially
  const sorted = [...remaining].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.processId.localeCompare(b.processId)
  );

  // Enqueue all processes that arrive at time 0
  for (const p of sorted) {
    if (p.arrivalTime <= currentTime) {
      queue.push(p);
      inQueue.add(p.processId);
    }
  }

  // If nothing arrived at 0, jump to first arrival
  if (queue.length === 0 && sorted.length > 0) {
    currentTime = sorted[0].arrivalTime;
    queue.push(sorted[0]);
    inQueue.add(sorted[0].processId);
  }

  while (completed < n) {
    if (queue.length === 0) {
      // Find next arriving process not yet enqueued
      const next = sorted.find((p) => !inQueue.has(p.processId) && completionTimes[p.processId] === undefined);
      if (next) {
        currentTime = next.arrivalTime;
        queue.push(next);
        inQueue.add(next.processId);
      }
      continue;
    }

    const current = queue.shift()!;
    const execTime = Math.min(current.remainingBurst, quantum);
    const startTime = currentTime;
    currentTime += execTime;
    current.remainingBurst -= execTime;

    // Enqueue newly arrived processes during this time slice (before re-enqueuing current)
    for (const p of sorted) {
      if (
        p.arrivalTime > startTime &&
        p.arrivalTime <= currentTime &&
        !inQueue.has(p.processId)
      ) {
        queue.push(p);
        inQueue.add(p.processId);
      }
    }

    if (current.remainingBurst > 0) {
      queue.push(current);
    } else {
      completionTimes[current.processId] = currentTime;
      completed++;
    }
  }

  return processes.map((p) => {
    const completionTime = completionTimes[p.processId];
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    return { ...p, completionTime, turnaroundTime, waitingTime };
  });
}
