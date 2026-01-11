export type Period = "7" | "30" | "90" | "365";

export function periodToDays(period: any): number {
    const p = String(period ?? "30") as Period;
    const days = Number(p);
    return [7, 30, 90, 365].includes(days) ? days : 30;
}

export function cutoffFromPeriod(period?: unknown): Date {
  const p = typeof period === "string" ? period : undefined;
  const allowed = new Set(["7", "30", "90", "365"]);
  const days = p && allowed.has(p) ? Number(p) : 30;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);

  return cutoff;
}

