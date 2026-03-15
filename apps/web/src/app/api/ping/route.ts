import { NextRequest, NextResponse } from "next/server";
import { pingServices, pingIndexNow, pingGoogle } from "@/lib/ping";

export async function POST(request: NextRequest) {
  // Authenticate — require PAYLOAD_SECRET
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.PAYLOAD_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { urls, title } = await request
    .json()
    .catch(() => ({ urls: [] as string[], title: "" }));

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json(
      { success: false, error: "urls array is required" },
      { status: 400 },
    );
  }

  // Validate all URLs belong to vacationdeals.to
  const validUrls = urls.filter(
    (url: string) =>
      typeof url === "string" && url.startsWith("https://vacationdeals.to/"),
  );

  if (validUrls.length === 0) {
    return NextResponse.json(
      { success: false, error: "No valid vacationdeals.to URLs provided" },
      { status: 400 },
    );
  }

  await Promise.allSettled([
    ...validUrls.map((url: string) => pingServices(url, title)),
    pingIndexNow(validUrls),
    pingGoogle(),
  ]);

  return NextResponse.json({ success: true, pinged: validUrls.length });
}
