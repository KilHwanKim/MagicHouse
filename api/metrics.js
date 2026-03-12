async function forwardMetricEvent(payload) {
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event, page, anonymousId, properties } = req.body || {};
  if (!event || typeof event !== "string") {
    return res.status(400).json({ error: "event is required" });
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
    return res.status(result.forwarded ? 200 : 202).json(result);
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "Metrics forwarding failed",
    });
  }
}
