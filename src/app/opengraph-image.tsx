import { ImageResponse } from "next/og";

export const alt = "Well Knit Together Global Foundation — No caregiver should carry it alone.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const ring = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
    return { left: 930 + 150 * Math.cos(angle) - 22, top: 315 + 150 * Math.sin(angle) - 22, color: ["#fbf6ee", "#f0be70", "#e9b39b", "#a9c5b4"][index % 4] };
  });
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", padding: 72, color: "#fbf6ee", background: "linear-gradient(160deg, #24474c, #142a2e)", fontFamily: "Georgia" }}>
      <div style={{ position: "absolute", left: 930 - 105, top: 315 - 105, width: 210, height: 210, borderRadius: 999, border: "10px solid #c4683f", display: "flex" }} />
      <div style={{ position: "absolute", left: 930 - 95, top: 315 - 95, width: 190, height: 190, borderRadius: 999, border: "6px dashed #f0be70", display: "flex" }} />
      {ring.map((dot, index) => <div key={index} style={{ position: "absolute", left: dot.left, top: dot.top, width: 44, height: 44, borderRadius: 999, background: dot.color, display: "flex" }} />)}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: "#f0be70" }}>Well Knit Together</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 70, lineHeight: 1.05 }}>No caregiver should carry it alone.</div>
          <div style={{ display: "flex", color: "#d4dfd7", fontSize: 28, lineHeight: 1.3 }}>Support for women caregivers of children with disabilities in coastal Kenya and Kajiado.</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#b2c3b7" }}>Registered Kenyan NGO · NGO-KJUYVK4</div>
      </div>
    </div>,
    { ...size },
  );
}
