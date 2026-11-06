import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "well-knit-together-web" });
}
