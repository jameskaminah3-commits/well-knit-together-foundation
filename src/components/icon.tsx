const paths: Record<string, string> = {
  training: "M3 7l9-4 9 4-9 4-9-4zm3 2.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3V9.5M21 7v6",
  equipment: "M8 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0M10 7v6h5l2 6M10 10H6m4 3a5 5 0 1 0 5.6 6",
  learning: "M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0V5.5zM12 5.5V19",
  spaces: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
  advocacy: "M4 10v4h3l6 4V6L7 10H4zm13-1.5a4 4 0 0 1 0 7M19.5 6a7.5 7.5 0 0 1 0 12",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  chat: "M4 5h16v11H9l-5 4V5zm4 5h.01M12 10h.01M16 10h.01",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zm-3 9l2 2 4-4",
  heart: "M12 20s-7.5-4.6-9-9.3C2 7.4 4.2 5 7 5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 2.8 0 5 2.4 4 5.7-1.5 4.7-9 9.3-9 9.3z",
  hands: "M7 11V6a1.5 1.5 0 0 1 3 0v4m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v5m0-2a1.5 1.5 0 0 1 3 0v4.5A6.5 6.5 0 0 1 12.5 20H12a6 6 0 0 1-5-2.7L4.5 13a1.5 1.5 0 0 1 2.5-1.7L8 13",
  basket: "M4 10h16l-1.5 9h-13L4 10zm3 0l3-6m7 6l-3-6M9 14v2m3-2v2m3-2v2",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4l3 2",
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, className }: { name: IconName | string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d={paths[name] ?? paths.heart} />
    </svg>
  );
}
