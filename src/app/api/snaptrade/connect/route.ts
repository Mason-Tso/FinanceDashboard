import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getConnectUrl } from "@/lib/snaptrade";

/** Returns a one-time SnapTrade Connection Portal URL to link a brokerage. */
export async function POST() {
  if (!env.snaptrade.isConfigured) {
    return NextResponse.json(
      { error: "SnapTrade is not configured. Add SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY to .env.local." },
      { status: 400 },
    );
  }
  try {
    const url = await getConnectUrl();
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create connection link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
