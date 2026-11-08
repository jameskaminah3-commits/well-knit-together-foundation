import { createClient } from "@/lib/supabase/server";
export { formatMoney } from "@/lib/fundraising-shared";

export interface FundraisingCampaign {
  id: string;
  slug: string;
  title: string;
  summary: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  status: "draft" | "active" | "paused" | "closed";
  source?: "database" | "preview";
}

export async function getActiveCampaigns() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fundraising_campaigns")
    .select("id, slug, title, summary, goal_amount, raised_amount, currency, status")
    .eq("status", "active")
    .order("created_at");
  if (data?.length) return data.map((campaign) => ({ ...campaign, source: "database" })) as FundraisingCampaign[];
  if (error || !data?.length) return [{
    id: "00000000-0000-0000-0000-000000000005",
    slug: "local-preview",
    title: "Care, capacity, opportunity",
    summary: "Local preview: help caregivers and communities access practical support, skills, and inclusive opportunity across Kenya.",
    goal_amount: 500000,
    raised_amount: 0,
    currency: "KES",
    status: "active",
    source: "preview",
  } satisfies FundraisingCampaign];
  return [];
}

export function campaignProgress(campaign: FundraisingCampaign) {
  return Math.min(100, Math.round((campaign.raised_amount / campaign.goal_amount) * 100));
}
