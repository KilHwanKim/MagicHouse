import { NextRequest, NextResponse } from "next/server";

async function forwardMetricEvent(payload: Record<string, unknown>) {
  const webhookUrl = (process.env.METRICS_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return { accepted: false, forwarded: false };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Metrics webhook failed: ${response.status} ${message}`);
  }

  return { accepted: true, forwarded: true };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { event, page, anonymousId, properties } = body || {};

  if (!event || typeof event !== "string") {
    return NextResponse.json({ error: "event is required" }, { status: 400 });
  }

  const payload = {
    event,
    page: typeof page === "string" ? page : "",
    anonymousId: typeof anonymousId === "string" ? anonymousId : "",
    properties: properties && typeof properties === "object" ? properties : {},
    occurredAt: new Date().toISOString(),
  };

  try {
    const result = await forwardMetricEvent(payload);
    return NextResponse.json(result, { status: result.forwarded ? 200 : 202 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Metrics forwarding failed",
      },
      { status: 502 },
    );
  }
}
