import { ProcessResult, AlgorithmResult } from "./types";

export function calculateMetrics(
  algorithmName: AlgorithmResult["algorithmName"],
  results: ProcessResult[]
): AlgorithmResult {
  const n = results.length;

  const avgWaitingTime =
    results.reduce((sum, p) => sum + p.waitingTime, 0) / n;

  const avgTurnaroundTime =
    results.reduce((sum, p) => sum + p.turnaroundTime, 0) / n;

  const totalBurstTime = results.reduce((sum, p) => sum + p.burstTime, 0);
  const firstArrival = Math.min(...results.map((p) => p.arrivalTime));
  const lastCompletion = Math.max(...results.map((p) => p.completionTime));
  const totalTime = lastCompletion - firstArrival;

  const cpuUtilization = totalTime > 0 ? (totalBurstTime / totalTime) * 100 : 100;
  const throughput = totalTime > 0 ? n / totalTime : 0;

  return {
    algorithmName,
    perProcessResults: results,
    avgWaitingTime: parseFloat(avgWaitingTime.toFixed(2)),
    avgTurnaroundTime: parseFloat(avgTurnaroundTime.toFixed(2)),
    cpuUtilization: parseFloat(cpuUtilization.toFixed(2)),
    throughput: parseFloat(throughput.toFixed(4)),
  };
}
