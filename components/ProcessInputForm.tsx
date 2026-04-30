"use client";

import { useState } from "react";
import { Process } from "@/lib/types";

// Keep ProcessRow exported so any remaining legacy imports don't break
export interface ProcessRow {
  id: string;
  processId: string;
  arrivalTime: string;
  burstTime: string;
}

interface Props {
  onAnalyze: (processes: Process[], quantum: number) => void;
}

const makeRow = (n: number): ProcessRow => ({
  id: crypto.randomUUID(),
  processId: `P${n}`,
  arrivalTime: "0",
  burstTime: "1",
});

const DEFAULT_ROWS: ProcessRow[] = [
  { id: "r1", processId: "P1", arrivalTime: "0", burstTime: "6" },
  { id: "r2", processId: "P2", arrivalTime: "2", burstTime: "4" },
  { id: "r3", processId: "P3", arrivalTime: "4", burstTime: "2" },
];

export default function ProcessInputForm({ onAnalyze }: Props) {
  const [rows, setRows] = useState<ProcessRow[]>(DEFAULT_ROWS);
  const [quantum, setQuantum] = useState("2");
  const [errors, setErrors] = useState<string[]>([]);

  const updateRow = (
    index: number,
    field: keyof Omit<ProcessRow, "id">,
    value: string
  ) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () =>
    setRows(prev => [...prev, makeRow(prev.length + 1)]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const seen = new Set<string>();

    rows.forEach((row, i) => {
      const lbl = `Row ${i + 1}`;
      const pid = row.processId.trim();
      if (!pid) {
        errs.push(`${lbl}: Process ID is required.`);
      } else if (seen.has(pid)) {
        errs.push(`${lbl}: Duplicate PID "${pid}".`);
      } else {
        seen.add(pid);
      }

      const at = parseInt(row.arrivalTime, 10);
      if (row.arrivalTime === "" || isNaN(at) || at < 0)
        errs.push(`${lbl}: Arrival Time must be ≥ 0.`);

      const bt = parseInt(row.burstTime, 10);
      if (row.burstTime === "" || isNaN(bt) || bt <= 0)
        errs.push(`${lbl}: Burst Time must be ≥ 1.`);
    });

    const q = parseInt(quantum);
    if (isNaN(q) || q < 1) errs.push("Quantum must be a positive integer.");

    return errs;
  };

  const handleAnalyze = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    const processes: Process[] = rows.map(r => ({
      processId: r.processId.trim(),
      arrivalTime: parseInt(r.arrivalTime, 10),
      burstTime: parseInt(r.burstTime, 10),
    }));

    onAnalyze(processes, parseInt(quantum, 10) || 2);
  };

  const inputCls =
    "w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg " +
    "text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
    "placeholder-slate-600";

  return (
    <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-5 space-y-5 h-fit">

      {/* ── Process table ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Processes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left pb-2 pr-2 text-xs text-slate-500 font-medium">PID</th>
                <th className="text-left pb-2 pr-2 text-xs text-slate-500 font-medium">Arrival</th>
                <th className="text-left pb-2 pr-2 text-xs text-slate-500 font-medium">Burst</th>
                <th className="pb-2 w-7" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {rows.map((row, i) => (
                <tr key={row.id}>
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={row.processId}
                      onChange={e => updateRow(i, "processId", e.target.value)}
                      className={inputCls}
                      placeholder="P1"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={row.arrivalTime}
                      min="0"
                      onChange={e => updateRow(i, "arrivalTime", e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={row.burstTime}
                      min="1"
                      onChange={e => updateRow(i, "burstTime", e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={rows.length <= 1}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 disabled:opacity-20 transition-colors rounded text-lg leading-none"
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
        >
          + Add Process
        </button>
      </div>

      {/* ── Time quantum for Round Robin ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Round Robin Quantum
        </h2>
        <input
          type="number"
          min="1"
          value={quantum}
          onChange={e => setQuantum(e.target.value)}
          className={`${inputCls} w-24`}
        />
        <p className="mt-2 text-xs text-slate-500">
          The engine will compare all algorithms and use this value for Round Robin.
        </p>
      </div>

      {/* ── Validation errors ── */}
      {errors.length > 0 && (
        <div className="bg-red-950/60 border border-red-700/60 rounded-lg p-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e}</p>
          ))}
        </div>
      )}

      {/* ── Analyze button ── */}
      <button
        type="button"
        onClick={handleAnalyze}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors"
      >
        Analyze
      </button>
    </div>
  );
}
