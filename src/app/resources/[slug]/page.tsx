import { notFound } from "next/navigation";
import { getPublishedContentItem, getPublicMediaUrl } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = await getPublishedContentItem(slug); if (!item || item.content_type !== "resource") notFound(); const downloadUrl = item.file_path?.startsWith("public-media/") ? getPublicMediaUrl(item.file_path.slice("public-media/".length)) : item.file_path; return <article className="section"><div className="container story-body"><p className="eyebrow">Resource</p><h1>{item.title}</h1><p className="lead muted">{item.excerpt}</p><div className="story-body">{item.body.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{downloadUrl && <p><a className="button" href={downloadUrl}>Download resource</a></p>}</div></article>; }
