import { createClient } from "@/lib/supabase/server";
import { previewContentAllowed } from "@/lib/site";
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

const previewCampaign: FundraisingCampaign = {
  id: "00000000-0000-0000-0000-000000000005",
  slug: "local-preview",
  title: "Care, capacity, opportunity (sample)",
  summary: "Local preview only: a sample campaign used to review the giving journey.",
  goal_amount: 500000,
  raised_amount: 0,
  currency: "KES",
  status: "active",
  source: "preview",
};

export async function getActiveCampaigns(): Promise<FundraisingCampaign[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("fundraising_campaigns")
      .select("id, slug, title, summary, goal_amount, raised_amount, currency, status")
      .eq("status", "active")
      .order("created_at");
    if (data?.length) return data.map((campaign) => ({ ...campaign, source: "database" })) as FundraisingCampaign[];
  } catch {
    // Fall through to local preview content in development only.
  }
  return previewContentAllowed() ? [previewCampaign] : [];
}

export function campaignProgress(campaign: FundraisingCampaign) {
  if (!campaign.goal_amount) return 0;
  return Math.min(100, Math.round((campaign.raised_amount / campaign.goal_amount) * 100));
}
