import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { getPublishedContentItem, mediaSrc } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedContentItem(slug);
  return { title: item?.seo_title ?? item?.title ?? "News", description: item?.seo_description ?? item?.excerpt };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContentItem(slug);
  if (!item || item.content_type !== "news") notFound();
  return <article className="section"><div className="container story-body"><p className="eyebrow">News{item.published_at ? ` · ${new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(new Date(item.published_at))}` : ""}</p><h1>{item.title}</h1><p className="lead muted">{item.excerpt}</p><CoverImage src={mediaSrc(item.image_path)} priority className="cover-detail" /><div className="story-body">{item.body.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div></article>;
}
