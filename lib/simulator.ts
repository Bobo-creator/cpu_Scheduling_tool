import { Process, ProcessResult } from "./types";

export type AlgorithmType = "FCFS" | "SJF" | "SRTF" | "RoundRobin";

/** One segment of time in the Gantt chart */
export interface SimStep {
  startTime: number;
  endTime: number;
  processId: string | null; // null = CPU idle
  reason: string;
  /** Remaining burst for every process at the START of this step */
  remainingBefore: Record<string, number>;
}

export interface SimulationOutput {
  algorithm: AlgorithmType;
  steps: SimStep[];
  processResults: ProcessResult[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapshot(remaining: Map<string, number>): Record<string, number> {
  const obj: Record<string, number> = {};
  remaining.forEach((v, k) => { obj[k] = v; });
  return obj;
}

function metrics(results: ProcessResult[]) {
  const n = results.length;
  if (n === 0) return { avgWaitingTime: 0, avgTurnaroundTime: 0 };
  const avgWaitingTime =
    Math.round((results.reduce((s, r) => s + r.waitingTime, 0) / n) * 100) / 100;
  const avgTurnaroundTime =
    Math.round((results.reduce((s, r) => s + r.turnaroundTime, 0) / n) * 100) / 100;
  return { avgWaitingTime, avgTurnaroundTime };
}

// ---------------------------------------------------------------------------
// FCFS – non-preemptive, arrival-time order
// ---------------------------------------------------------------------------

function simulateFCFS(processes: Process[]): SimulationOutput {
  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.processId.localeCompare(b.processId)
  );

  const remaining = new Map(processes.map(p => [p.processId, p.burstTime]));
  const steps: SimStep[] = [];
  const processResults: ProcessResult[] = [];
  let time = 0;

  for (const p of sorted) {
    if (time < p.arrivalTime) {
      steps.push({
        startTime: time,
        endTime: p.arrivalTime,
        processId: null,
        reason: `CPU idle — next process ${p.processId} arrives at t=${p.arrivalTime}`,
        remainingBefore: snapshot(remaining),
      });
      time = p.arrivalTime;
    }

    const snap = snapshot(remaining);
    const completionTime = time + p.burstTime;

    steps.push({
      startTime: time,
      endTime: completionTime,
      processId: p.processId,
      reason: `Running ${p.processId} (burst=${p.burstTime}) — FCFS order, arrived at t=${p.arrivalTime}`,
      remainingBefore: snap,
    });

    remaining.set(p.processId, 0);
    processResults.push({
      ...p,
      completionTime,
      turnaroundTime: completionTime - p.arrivalTime,
      waitingTime: completionTime - p.arrivalTime - p.burstTime,
    });
    time = completionTime;
  }

  return { algorithm: "FCFS", steps, processResults, ...metrics(processResults) };
}

// ---------------------------------------------------------------------------
// SJF – non-preemptive, shortest burst first at each decision point
// ---------------------------------------------------------------------------

function simulateSJF(processes: Process[]): SimulationOutput {
  const remaining = new Map(processes.map(p => [p.processId, p.burstTime]));
  const done = new Set<string>();
  const steps: SimStep[] = [];
  const processResults: ProcessResult[] = [];
  let time = 0;

  while (done.size < processes.length) {
    const available = processes.filter(
      p => p.arrivalTime <= time && !done.has(p.processId)
    );

    if (available.length === 0) {
      const pending = processes.filter(p => !done.has(p.processId));
      const nextArrival = Math.min(...pending.map(p => p.arrivalTime));
      const nextP = pending.find(p => p.arrivalTime === nextArrival)!;
      steps.push({
        startTime: time,
        endTime: nextArrival,
        processId: null,
        reason: `CPU idle — waiting for ${nextP.processId} to arrive at t=${nextArrival}`,
        remainingBefore: snapshot(remaining),
      });
      time = nextArrival;
      continue;
    }

    // Pick shortest original burst; tie-break by arrival, then processId
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.processId.localeCompare(b.processId);
    });

    const p = available[0];
    const snap = snapshot(remaining);
    const availList = available
      .map(a => `${a.processId}(${a.burstTime})`)
      .join(", ");
    const completionTime = time + p.burstTime;

    steps.push({
      startTime: time,
      endTime: completionTime,
      processId: p.processId,
      reason: `Running ${p.processId} — shortest burst (${p.burstTime}) among ready: [${availList}]`,
      remainingBefore: snap,
    });

    remaining.set(p.processId, 0);
    done.add(p.processId);
    processResults.push({
      ...p,
      completionTime,
      turnaroundTime: completionTime - p.arrivalTime,
      waitingTime: completionTime - p.arrivalTime - p.burstTime,
    });
    time = completionTime;
  }

  return { algorithm: "SJF", steps, processResults, ...metrics(processResults) };
}

// ---------------------------------------------------------------------------
// SRTF – preemptive SJF; preempts when a shorter remaining job arrives
// ---------------------------------------------------------------------------

function simulateSRTF(processes: Process[]): SimulationOutput {
  const remaining = new Map(processes.map(p => [p.processId, p.burstTime]));
  const completionTimes = new Map<string, number>();
  const steps: SimStep[] = [];
  let time = 0;

  while (completionTimes.size < processes.length) {
    const available = processes.filter(
      p => p.arrivalTime <= time && !completionTimes.has(p.processId)
    );

    if (available.length === 0) {
      const pending = processes.filter(p => !completionTimes.has(p.processId));
      const nextArrival = Math.min(...pending.map(p => p.arrivalTime));
      const nextP = pending.find(p => p.arrivalTime === nextArrival)!;
      steps.push({
        startTime: time,
        endTime: nextArrival,
        processId: null,
        reason: `CPU idle — waiting for ${nextP.processId} to arrive at t=${nextArrival}`,
        remainingBefore: snapshot(remaining),
      });
      time = nextArrival;
      continue;
    }

    // Pick shortest remaining; tie-break by arrival then processId
    available.sort((a, b) => {
      const ra = remaining.get(a.processId)!;
      const rb = remaining.get(b.processId)!;
      if (ra !== rb) return ra - rb;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.processId.localeCompare(b.processId);
    });

    const p = available[0];
    const curRem = remaining.get(p.processId)!;
    const snap = snapshot(remaining);

    // Find earliest future arrival that would preempt p
    let runUntil = time + curRem; // default: p completes
    let preemptedBy: string | null = null;

    const futureArrivals = processes
      .filter(q => !completionTimes.has(q.processId) && q.arrivalTime > time)
      .sort((a, b) => a.arrivalTime - b.arrivalTime);

    for (const q of futureArrivals) {
      if (q.arrivalTime >= runUntil) break; // arrives after p would finish
      const pRemAtQ = curRem - (q.arrivalTime - time);
      if (remaining.get(q.processId)! < pRemAtQ) {
        runUntil = q.arrivalTime;
        preemptedBy = q.processId;
        break; // earliest preemption found (arrivals are sorted)
      }
    }

    const segDur = runUntil - time;
    let reason: string;
    if (preemptedBy !== null) {
      const pRemAfter = curRem - segDur;
      const qBurst = remaining.get(preemptedBy)!;
      reason = `Running ${p.processId} (rem=${curRem}) — preempted at t=${runUntil} by ${preemptedBy} (burst=${qBurst} < ${pRemAfter})`;
    } else {
      reason = `Running ${p.processId} (rem=${curRem}) — completes at t=${runUntil}`;
    }

    steps.push({
      startTime: time,
      endTime: runUntil,
      processId: p.processId,
      reason,
      remainingBefore: snap,
    });

    remaining.set(p.processId, curRem - segDur);
    if (remaining.get(p.processId)! === 0) {
      completionTimes.set(p.processId, runUntil);
    }
    time = runUntil;
  }

  const processResults: ProcessResult[] = processes.map(p => {
    const completionTime = completionTimes.get(p.processId)!;
    return {
      ...p,
      completionTime,
      turnaroundTime: completionTime - p.arrivalTime,
      waitingTime: completionTime - p.arrivalTime - p.burstTime,
    };
  });

  return { algorithm: "SRTF", steps, processResults, ...metrics(processResults) };
}

// ---------------------------------------------------------------------------
// Round Robin – cyclic quantum-based scheduling
// ---------------------------------------------------------------------------

function simulateRoundRobin(processes: Process[], quantum: number): SimulationOutput {
  const remaining = new Map(processes.map(p => [p.processId, p.burstTime]));
  const completionTimes = new Map<string, number>();
  const steps: SimStep[] = [];

  const sorted = [...processes].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.processId.localeCompare(b.processId)
  );

  const queue: string[] = [];
  const inQueue = new Set<string>();
  let time = 0;

  // Seed queue with t=0 arrivals
  for (const p of sorted) {
    if (p.arrivalTime <= time) {
      queue.push(p.processId);
      inQueue.add(p.processId);
    }
  }

  // If nothing at t=0, jump to first arrival
  if (queue.length === 0 && sorted.length > 0) {
    time = sorted[0].arrivalTime;
    queue.push(sorted[0].processId);
    inQueue.add(sorted[0].processId);
  }

  while (completionTimes.size < processes.length) {
    if (queue.length === 0) {
      const next = sorted.find(
        p => !inQueue.has(p.processId) && !completionTimes.has(p.processId)
      );
      if (next) {
        steps.push({
          startTime: time,
          endTime: next.arrivalTime,
          processId: null,
          reason: `CPU idle — queue empty, waiting for ${next.processId} at t=${next.arrivalTime}`,
          remainingBefore: snapshot(remaining),
        });
        time = next.arrivalTime;
        queue.push(next.processId);
        inQueue.add(next.processId);
      }
      continue;
    }

    const pid = queue.shift()!;
    const remBurst = remaining.get(pid)!;
    const execTime = Math.min(remBurst, quantum);
    const startTime = time;
    const endTime = time + execTime;

    const snap = snapshot(remaining);
    const queueLabel = [pid, ...queue].slice(0, 6).join(" → ");

    time = endTime;
    remaining.set(pid, remBurst - execTime);

    // Enqueue processes that arrived during this slice
    for (const p of sorted) {
      if (
        p.arrivalTime > startTime &&
        p.arrivalTime <= endTime &&
        !inQueue.has(p.processId)
      ) {
        queue.push(p.processId);
        inQueue.add(p.processId);
      }
    }

    const newRem = remaining.get(pid)!;
    if (newRem > 0) {
      queue.push(pid);
      steps.push({
        startTime,
        endTime,
        processId: pid,
        reason: `Running ${pid} for quantum=${quantum} (rem ${remBurst}→${newRem}) — queue: [${queueLabel}]`,
        remainingBefore: snap,
      });
    } else {
      completionTimes.set(pid, time);
      steps.push({
        startTime,
        endTime,
        processId: pid,
        reason: `Running ${pid} — completes at t=${time} (used ${execTime} of quantum=${quantum})`,
        remainingBefore: snap,
      });
    }
  }

  const processResults: ProcessResult[] = processes.map(p => {
    const completionTime = completionTimes.get(p.processId)!;
    return {
      ...p,
      completionTime,
      turnaroundTime: completionTime - p.arrivalTime,
      waitingTime: completionTime - p.arrivalTime - p.burstTime,
    };
  });

  return { algorithm: "RoundRobin", steps, processResults, ...metrics(processResults) };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulate(
  processes: Process[],
  algorithm: AlgorithmType,
  quantum = 2
): SimulationOutput {
  if (processes.length === 0) {
    return {
      algorithm,
      steps: [],
      processResults: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
    };
  }
  switch (algorithm) {
    case "FCFS":       return simulateFCFS(processes);
    case "SJF":        return simulateSJF(processes);
    case "SRTF":       return simulateSRTF(processes);
    case "RoundRobin": return simulateRoundRobin(processes, quantum);
  }
}
