"use client";

import { useState } from "react";

export interface ProcessRow {
  id: string; // local key for React
  processId: string;
  arrivalTime: string;
  burstTime: string;
}

interface Props {
  onSubmit: (processes: ProcessRow[], quantum: number) => void;
  loading: boolean;
}

const emptyRow = (): ProcessRow => ({
  id: crypto.randomUUID(),
  processId: "",
  arrivalTime: "",
  burstTime: "",
});

export default function ProcessInputForm({ onSubmit, loading }: Props) {
  const [rows, setRows] = useState<ProcessRow[]>([emptyRow()]);
  const [quantum, setQuantum] = useState("2");
  const [errors, setErrors] = useState<string[]>([]);

  const updateRow = (index: number, field: keyof Omit<ProcessRow, "id">, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const seenIds = new Set<string>();

    rows.forEach((row, i) => {
      const label = `Row ${i + 1}`;
      if (!row.processId.trim()) errs.push(`${label}: Process ID is required.`);
      else if (seenIds.has(row.processId.trim())) errs.push(`${label}: Process ID "${row.processId}" is duplicated.`);
      else seenIds.add(row.processId.trim());

      const arrival = parseInt(row.arrivalTime);
      if (row.arrivalTime === "" || isNaN(arrival) || arrival < 0)
        errs.push(`${label}: Arrival Time must be a non-negative integer.`);

      const burst = parseInt(row.burstTime);
      if (row.burstTime === "" || isNaN(burst) || burst <= 0)
        errs.push(`${label}: Burst Time must be a positive integer.`);
    });

    const q = parseInt(quantum);
    if (isNaN(q) || q < 1) errs.push("Round Robin quantum must be a positive integer.");

    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    onSubmit(rows, parseInt(quantum));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Process rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="pb-2 pr-4 font-medium">Process ID</th>
              <th className="pb-2 pr-4 font-medium">Arrival Time</th>
              <th className="pb-2 pr-4 font-medium">Burst Time</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td className="py-2 pr-4">
                  <input
                    type="text"
                    placeholder="e.g. P1"
                    value={row.processId}
                    onChange={(e) => updateRow(i, "processId", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={row.arrivalTime}
                    onChange={(e) => updateRow(i, "arrivalTime", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={row.burstTime}
                    onChange={(e) => updateRow(i, "burstTime", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400"
                  />
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="px-2 py-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                    title="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row + quantum */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={addRow}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Process
        </button>

        <div className="sm:ml-auto flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
            RR Quantum:
          </label>
          <input
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => setQuantum(e.target.value)}
            className="w-20 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
          />
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-600">
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm"
      >
        {loading ? "Running algorithms…" : "Compare Algorithms"}
      </button>
    </form>
  );
}
