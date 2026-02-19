import { kv } from "@vercel/kv";

const KV_PREFIX = "shared_records:";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keys = await kv.keys(`${KV_PREFIX}*`);
    const titles = [];
    
    for (const key of keys) {
      const records = await kv.get(key);
      if (Array.isArray(records) && records.length > 0) {
        const title = key.replace(KV_PREFIX, "");
        titles.push({ title, count: records.length });
      }
    }
    
    return res.json({ titles });
  } catch (err) {
    console.error("KV 작품 목록 조회 실패:", err);
    return res.status(500).json({ error: err.message });
  }
}
