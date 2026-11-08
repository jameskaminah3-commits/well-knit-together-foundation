import { ImageResponse } from "next/og";

export const alt = "Well Knit Together Global Foundation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, color: "#fbf8f3", background: "#24343a", fontFamily: "Georgia" }}><div style={{ display: "flex", fontSize: 28, letterSpacing: 5, textTransform: "uppercase" }}>Well Knit Together</div><div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ display: "flex", fontSize: 72, lineHeight: 1.05 }}>Care is the thread. Community is the strength.</div><div style={{ display: "flex", color: "#f0be70", fontSize: 28 }}>Stronger caregivers. More inclusive communities.</div></div></div>, { ...size }); }
