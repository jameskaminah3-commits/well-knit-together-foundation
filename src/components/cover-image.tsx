import Image from "next/image";

/** A 16:9 cover for programmes, stories, and news. Decorative: the title next to it carries the meaning. */
export function CoverImage({ src, priority = false, className = "" }: { src: string | null; priority?: boolean; className?: string }) {
  if (!src) return null;
  return <div className={`cover-image ${className}`.trim()}><Image src={src} alt="" fill sizes="(max-width: 850px) 100vw, 50vw" priority={priority} unoptimized={src.endsWith(".svg")} /></div>;
}
