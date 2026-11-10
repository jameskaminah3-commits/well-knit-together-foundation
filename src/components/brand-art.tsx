/**
 * Original, rights-free artwork for Well Knit Together.
 * The motif is a circle of people joined by two braided threads: care is the
 * thread, community is the strength. Geometry is deterministic so server and
 * client renders always match.
 */

type ArtVariant = "circle" | "weave" | "threads";

const palette = {
  deep: "#1e3a3f",
  deeper: "#142a2e",
  terracotta: "#c4683f",
  gold: "#f0be70",
  sage: "#a9c5b4",
  cream: "#fbf6ee",
  blush: "#e9b39b",
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function braidPath(cx: number, cy: number, radius: number, amplitude: number, lobes: number, phase: number) {
  const steps = 360;
  const points: string[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const theta = (step / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(lobes * theta + phase);
    points.push(`${round(cx + r * Math.cos(theta))},${round(cy + r * Math.sin(theta))}`);
  }
  return `M${points.join("L")}Z`;
}

function CircleArt({ id }: { id: string }) {
  const cx = 240;
  const cy = 258;
  const people = 8;
  const figureColors = [palette.cream, palette.gold, palette.blush, palette.sage];
  return (
    <>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24474c" />
          <stop offset="1" stopColor={palette.deeper} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.gold} stopOpacity="0.32" />
          <stop offset="1" stopColor={palette.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="600" fill={`url(#${id}-bg)`} />
      <circle cx={cx} cy={cy} r="210" fill={`url(#${id}-glow)`} />
      {[250, 205, 160].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={palette.cream} strokeOpacity="0.07" />)}
      <path d={braidPath(cx, cy, 118, 13, 12, 0)} fill="none" stroke={palette.terracotta} strokeWidth="7" strokeLinecap="round" />
      <path d={braidPath(cx, cy, 118, 13, 12, Math.PI)} fill="none" stroke={palette.gold} strokeWidth="7" strokeLinecap="round" />
      {Array.from({ length: people }, (_, index) => {
        const angle = (index / people) * Math.PI * 2 - Math.PI / 2;
        const x = round(cx + 168 * Math.cos(angle));
        const y = round(cy + 168 * Math.sin(angle));
        const rotation = round((angle * 180) / Math.PI + 90);
        const color = figureColors[index % figureColors.length];
        return (
          <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`}>
            <circle cx="0" cy="-14" r="13" fill={color} />
            <path d="M-24 22 C-24 2 -12 -2 0 -2 C12 -2 24 2 24 22 Z" fill={color} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="54" fill={palette.cream} fillOpacity="0.08" />
      <path
        d={`M${cx} ${cy + 22} C${cx - 34} ${cy} ${cx - 30} ${cy - 30} ${cx - 12} ${cy - 30} C${cx - 4} ${cy - 30} ${cx} ${cy - 24} ${cx} ${cy - 18} C${cx} ${cy - 24} ${cx + 4} ${cy - 30} ${cx + 12} ${cy - 30} C${cx + 30} ${cy - 30} ${cx + 34} ${cy} ${cx} ${cy + 22} Z`}
        fill={palette.terracotta}
      />
    </>
  );
}

function WeaveArt({ id }: { id: string }) {
  const cell = 60;
  const colors = [palette.terracotta, palette.gold, palette.sage, palette.blush, palette.cream];
  const tiles = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const horizontal = (row + col) % 2 === 0;
      const color = colors[(row * 3 + col * 2) % colors.length];
      const x = col * cell;
      const y = row * cell;
      tiles.push(
        <g key={`${row}-${col}`}>
          {horizontal
            ? [10, 25, 40].map((offset) => <rect key={offset} x={x + 4} y={y + offset} width={cell - 8} height="10" rx="5" fill={color} fillOpacity={offset === 25 ? 1 : 0.72} />)
            : [10, 25, 40].map((offset) => <rect key={offset} x={x + offset} y={y + 4} width="10" height={cell - 8} rx="5" fill={color} fillOpacity={offset === 25 ? 1 : 0.72} />)}
        </g>,
      );
    }
  }
  return (
    <>
      <rect width="480" height="600" fill={palette.deep} />
      <g opacity="0.92">{tiles}</g>
      <rect width="480" height="600" fill={`url(#${id}-fade)`} />
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor={palette.deeper} stopOpacity="0" />
          <stop offset="1" stopColor={palette.deeper} stopOpacity="0.75" />
        </linearGradient>
      </defs>
    </>
  );
}

function ThreadsArt() {
  const colors = [palette.gold, palette.terracotta, palette.sage, palette.cream, palette.blush];
  return (
    <>
      <rect width="480" height="600" fill="#f3e6da" />
      {Array.from({ length: 14 }, (_, index) => {
        const y = 40 + index * 38;
        const color = colors[index % colors.length];
        return (
          <path
            key={index}
            d={`M-20 ${y} C 120 ${y - 60 + (index % 3) * 30}, 260 ${y + 70 - (index % 4) * 25}, 500 ${y - 10}`}
            fill="none"
            stroke={color === palette.cream ? palette.deep : color}
            strokeOpacity={color === palette.cream ? 0.5 : 0.95}
            strokeWidth={index % 2 ? 6 : 10}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="240" cy="300" r="70" fill={palette.deep} />
      <circle cx="240" cy="300" r="46" fill="none" stroke={palette.gold} strokeWidth="6" strokeDasharray="14 10" />
    </>
  );
}

export function BrandArt({ variant, label, className }: { variant: ArtVariant; label: string; className?: string }) {
  const id = `art-${variant}`;
  return (
    <svg className={className} viewBox="0 0 480 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
      {variant === "circle" && <CircleArt id={id} />}
      {variant === "weave" && <WeaveArt id={id} />}
      {variant === "threads" && <ThreadsArt />}
    </svg>
  );
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill={palette.deep} />
      <path d={braidPath(32, 32, 17, 3.2, 6, 0)} fill="none" stroke={palette.gold} strokeWidth="3.4" />
      <path d={braidPath(32, 32, 17, 3.2, 6, Math.PI)} fill="none" stroke={palette.terracotta} strokeWidth="3.4" />
      <circle cx="32" cy="32" r="5" fill={palette.cream} />
    </svg>
  );
}
