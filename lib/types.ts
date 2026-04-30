export interface Process {
  processId: string;
  arrivalTime: number;
  burstTime: number;
  completionTime?: number;
  waitingTime?: number;
  turnaroundTime?: number;
}

export interface ProcessResult extends Process {
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

export interface AlgorithmResult {
  algorithmName: "FCFS" | "SJF" | "SRTF" | "RoundRobin";
  perProcessResults: ProcessResult[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
  score: number;
}

export interface Recommendation {
  algorithmName: string;
  reasonText: string;
}

export interface ComparisonOutput {
  results: AlgorithmResult[];
  recommendation: Recommendation;
  aiExplanation?: string;
}
