import { createServerFn } from "@tanstack/react-start";

export type CampaignProgress = { title: string; goal: number; since: string; total: number; count: number; impacts: Record<string, string> };
export const getCampaignProgress = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicBackendClient } = await import("./public-backend.server");
  const client = createPublicBackendClient();
  const { data, error } = await client.rpc("public_campaign_progress");
  if (error) throw new Error("Progresul campaniei nu a putut fi încărcat.");
  return data as CampaignProgress | null;
});