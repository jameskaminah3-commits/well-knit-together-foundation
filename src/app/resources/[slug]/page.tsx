import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedContentItem, publicFileUrl } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedContentItem(slug);
  return { title: item?.seo_title ?? item?.title ?? "Resource", description: item?.seo_description ?? item?.excerpt };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContentItem(slug);
  if (!item || item.content_type !== "resource") notFound();
  const downloadUrl = publicFileUrl(item.file_path);
  return <article className="section"><div className="container story-body"><p className="eyebrow">Resource</p><h1>{item.title}</h1><p className="lead muted">{item.excerpt}</p><div className="story-body">{item.body.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{downloadUrl && <p><a className="button" href={downloadUrl} rel="noopener noreferrer">Download resource</a></p>}</div></article>;
}
