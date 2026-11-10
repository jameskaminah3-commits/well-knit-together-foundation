import type { MetadataRoute } from "next";
import { getPublishedContentItems, getPublishedPrograms, getPublishedStories } from "@/lib/content";
import { getUpcomingEvents } from "@/lib/engagement";

const pathFor = { news: "news", event: "events", resource: "resources", report: "reports" } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [programs, stories, items, events] = await Promise.all([getPublishedPrograms(), getPublishedStories(), getPublishedContentItems(), getUpcomingEvents()]);
  const staticRoutes = ["", "/about", "/programs", "/impact", "/support", "/donate", "/engage", "/engage/partner", "/engage/volunteer", "/contact", "/reports", "/marketplace", "/news", "/events", "/resources", "/feedback", "/privacy", "/terms", "/safeguarding", "/refunds", "/marketplace/terms"];
  const priorities: Record<string, number> = { "": 1, "/support": .9, "/donate": .9, "/about": .8, "/programs": .8, "/contact": .8 };
  const eventSlugs = new Set(events.filter((event) => event.source === "database").map((event) => event.slug));
  return [
    ...staticRoutes.map((path) => ({ url: `${site}${path}`, changeFrequency: "weekly" as const, priority: priorities[path] ?? .6 })),
    ...programs.map((item) => ({ url: `${site}/programs/${item.slug}`, changeFrequency: "monthly" as const, priority: .7 })),
    ...stories.map((item) => ({ url: `${site}/impact/${item.slug}`, changeFrequency: "monthly" as const, priority: .6 })),
    ...[...eventSlugs].map((slug) => ({ url: `${site}/events/${slug}`, changeFrequency: "weekly" as const, priority: .6 })),
    ...items.filter((item) => !(item.content_type === "event" && eventSlugs.has(item.slug))).map((item) => ({ url: `${site}/${pathFor[item.content_type]}/${item.slug}`, changeFrequency: "weekly" as const, priority: .6 })),
  ];
}
