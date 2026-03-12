import { kv } from "@vercel/kv";

const KV_PREFIX = "shared_records:";

function hasSharedRecordsConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function sendSharedRecordsUnavailable(res) {
  return res.status(503).json({
    error: "Shared records storage is not configured",
    code: "SHARED_RECORDS_UNAVAILABLE",
  });
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

function decorateRecordsWithSlug(records, title) {
  const slug = buildRecordSlug(title, records[0]);
  return (records || []).map((record) => ({
    ...record,
    slug,
  }));
}

async function getRecordsBySlug(slug) {
  const keys = await kv.keys(`${KV_PREFIX}*`);
  for (const key of keys) {
    const title = key.replace(KV_PREFIX, "");
    const records = await kv.get(key);
    if (!Array.isArray(records) || records.length === 0) {
      continue;
    }

    if (buildRecordSlug(title, records[0]) === slug) {
      return { title, records };
    }
  }

  return { title: null, records: [] };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    // POST: 공유 기록 추가
    if (req.method === "POST") {
      const { title, type, data, shareMethod, userId } = req.body;
      
      if (!title || !type || !data) {
        return res.status(400).json({ error: "title, type, data are required" });
      }
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!hasSharedRecordsConfig()) {
        return sendSharedRecordsUnavailable(res);
      }

      const recordId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const record = {
        id: recordId,
        userId: userId,
        type: type,
        sharedAt: new Date().toISOString(),
        data: data,
        shareMethod: shareMethod || "image",
        preview: type === "book" 
          ? `${title} - ${data.questions?.length || 0}개 질문`
          : (data.q || "").slice(0, 50) + (data.q?.length > 50 ? "…" : "")
      };

      // 작품별로 리스트에 추가
      const key = `${KV_PREFIX}${title}`;
      const existing = await kv.get(key);
      const records = Array.isArray(existing) ? existing : [];
      records.push(record);
      
      // 최근 50개만 보관
      const trimmed = records.slice(-50);
      await kv.set(key, trimmed);

      return res.json({ success: true, recordId });
    }

    // DELETE: 공유 기록 삭제
    if (req.method === "DELETE") {
      const { title, recordId, userId } = req.body;
      
      if (!title || !recordId || !userId) {
        return res.status(400).json({ error: "title, recordId, and userId are required" });
      }

      if (!hasSharedRecordsConfig()) {
        return sendSharedRecordsUnavailable(res);
      }

      const key = `${KV_PREFIX}${title}`;
      const records = await kv.get(key);
      
      if (!Array.isArray(records)) {
        return res.json({ success: false, message: "No records found" });
      }

      // userId와 recordId가 모두 일치하는 기록만 삭제
      const recordToDelete = records.find(r => r.id === recordId && r.userId === userId);
      if (!recordToDelete) {
        return res.status(403).json({ success: false, message: "Record not found or access denied" });
      }

      const filtered = records.filter((r) => !(r.id === recordId && r.userId === userId));
      
      if (filtered.length === 0) {
        // 기록이 없으면 키 삭제
        await kv.del(key);
      } else {
        await kv.set(key, filtered);
      }

      return res.json({ success: true });
    }

    // GET: 공유 기록 조회 (작품별 또는 전체)
    if (req.method === "GET") {
      if (!hasSharedRecordsConfig()) {
        return sendSharedRecordsUnavailable(res);
      }

      const { title, slug } = req.query;
      
      if (title) {
        // 특정 작품의 기록만 조회
        const key = `${KV_PREFIX}${title}`;
        const records = await kv.get(key);
        const safeRecords = Array.isArray(records) ? records : [];
        return res.json({
          title,
          slug: buildRecordSlug(String(title), safeRecords[0]),
          records: decorateRecordsWithSlug(safeRecords, String(title)),
        });
      } else if (slug) {
        const result = await getRecordsBySlug(String(slug));
        return res.json({
          title: result.title,
          slug: String(slug),
          records: result.title ? decorateRecordsWithSlug(result.records, result.title) : [],
        });
      } else {
        // 모든 작품의 기록 조회
        const keys = await kv.keys(`${KV_PREFIX}*`);
        const allRecords = [];
        
        for (const key of keys) {
          const records = await kv.get(key);
          if (Array.isArray(records)) {
            const titleFromKey = key.replace(KV_PREFIX, "");
            const slugValue = buildRecordSlug(titleFromKey, records[0]);
            records.forEach((record) => {
              allRecords.push({ ...record, title: titleFromKey, slug: slugValue });
            });
          }
        }
        
        // 시간순 정렬
        allRecords.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
        return res.json({ records: allRecords });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("KV 오류:", err);
    return res.status(500).json({ error: err.message });
  }
}
