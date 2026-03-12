import { kv } from "@vercel/kv";

const KV_PREFIX = "shared_records:";

function hasSharedRecordsConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function slugifySegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildRecordSlug(title, sampleRecord) {
  const mediaType = sampleRecord?.data?.mediaType || sampleRecord?.data?.type || "";
  const workId = sampleRecord?.data?.workId || "";
  const titleSlug = slugifySegment(title) || "record";

  if (mediaType && workId) {
    return `${titleSlug}--${slugifySegment(mediaType)}--${workId}`;
  }

  return titleSlug;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasSharedRecordsConfig()) {
    return res.status(503).json({
      error: "Shared records storage is not configured",
      code: "SHARED_RECORDS_UNAVAILABLE",
    });
  }

  try {
    const keys = await kv.keys(`${KV_PREFIX}*`);
    const titles = [];
    
    for (const key of keys) {
      const records = await kv.get(key);
      if (Array.isArray(records) && records.length > 0) {
        const title = key.replace(KV_PREFIX, "");
        titles.push({ title, count: records.length, slug: buildRecordSlug(title, records[0]) });
      }
    }
    
    return res.json({ titles });
  } catch (err) {
    console.error("KV 작품 목록 조회 실패:", err);
    return res.status(500).json({ error: err.message });
  }
}
