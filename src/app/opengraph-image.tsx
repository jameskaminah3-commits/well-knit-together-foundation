import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Well Knit Together Global Foundation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, color: "#f7f6f1", background: "#24483a", fontFamily: "Georgia" }}><div style={{ display: "flex", fontSize: 28, letterSpacing: 5, textTransform: "uppercase" }}>Well Knit Together</div><div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ display: "flex", fontSize: 72, lineHeight: 1.05 }}>Every person has a place in the circle.</div><div style={{ display: "flex", color: "#dce8d9", fontSize: 28 }}>Stronger caregivers. More inclusive communities.</div></div></div>, { ...size }); }
