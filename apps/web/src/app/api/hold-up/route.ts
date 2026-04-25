import { NextResponse } from "next/server";
import { checkUrl } from "@/lib/hold-up-check";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  const result = await checkUrl(url);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    if (!body?.url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
    const result = await checkUrl(body.url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
