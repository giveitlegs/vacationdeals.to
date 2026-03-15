import { NextRequest, NextResponse } from "next/server";
import { pingServices, pingIndexNow, pingGoogle } from "@/lib/ping";

export async function POST(request: NextRequest) {
  const { urls, title } = await request
    .json()
    .catch(() => ({ urls: [] as string[], title: "" }));

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json(
      { success: false, error: "urls array is required" },
      { status: 400 },
    );
  }

  // Ping all services in parallel
  await Promise.allSettled([
    ...urls.map((url: string) => pingServices(url, title)),
    pingIndexNow(urls),
    pingGoogle(),
  ]);

  return NextResponse.json({ success: true, pinged: urls.length });
}
