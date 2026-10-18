import { describe, expect, it } from "vitest";
import { campaignPercent, campaignSchema, duesStatus, mergeTags } from "./module-rules";
describe("Reguli module", () => {
  it("limitează progresul la obiectiv fără a ascunde totalul", () => {
    expect(campaignPercent(250, 1000)).toBe(25);
    expect(campaignPercent(1500, 1000)).toBe(100);
    expect(campaignPercent(20, 0)).toBe(0);
  });
  it("cotizația este la zi doar când toate obligațiile sunt plătite", () => {
    expect(duesStatus([{ status: "platita", amount: 100 }])).toBe("La zi");
    expect(duesStatus([{ status: "scutita", amount: 0 }])).toBe("La zi");
    expect(duesStatus([{ status: "neplatita", amount: 100 }])).toBe("Restantă");
    expect(duesStatus([])).toBe("Neverificată");
  });
  it("adaugă etichete fără a le înlocui pe cele existente", () => {
    expect(mergeTags(["membru", "activ"], "activ, voluntar")).toEqual(["membru", "activ", "voluntar"]);
  });
  it("obiectivul trebuie să fie pozitiv", () => {
    expect(campaignSchema.safeParse({ enabled: true, title: "Campanie verde", goal: 0, since: "2026-10-18T00:00:00.000Z", impacts: {} }).success).toBe(false);
  });
});