import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { getPublishedStory, mediaSrc } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  return { title: story?.seo_title ?? story?.title ?? "Impact story", description: story?.seo_description ?? story?.excerpt };
}

export default async function ImpactStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) notFound();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Impact story</p><h1>{story.title}</h1><p>{story.excerpt}</p></div></section><article className="section"><div className="container story-body"><CoverImage src={mediaSrc(story.image_path)} priority className="cover-detail" />{story.body.split("\n").filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></>;
}
