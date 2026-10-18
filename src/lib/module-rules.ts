import { z } from "zod";

export const forumCategories = { general: "General", organizare: "Organizare", initiative: "Inițiative", evenimente: "Evenimente" };
export const campaignSchema = z.object({
  enabled: z.boolean(), title: z.string().trim().min(3).max(100),
  goal: z.number().positive().max(100000000), since: z.string().datetime(),
  impacts: z.record(z.string().max(160)),
});
export function campaignPercent(total: number, goal: number) {
  return goal > 0 ? Math.min(100, Math.max(0, total / goal * 100)) : 0;
}
export function duesStatus(rows: { status: string; amount: number }[]) {
  if (!rows.length) return "Neverificată";
  return rows.every(r => r.status === "platita" || r.status === "scutita") ? "La zi" : "Restantă";
}
export function mergeTags(existing: string[], added: string) {
  return [...new Set([...existing, ...added.split(",")].map(t => t.trim()).filter(Boolean))];
}