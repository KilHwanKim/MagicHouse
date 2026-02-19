import { kv } from "@vercel/kv";

const KV_PREFIX = "shared_records:";

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
      const { title } = req.query;
      
      if (title) {
        // 특정 작품의 기록만 조회
        const key = `${KV_PREFIX}${title}`;
        const records = await kv.get(key);
        return res.json({ records: Array.isArray(records) ? records : [] });
      } else {
        // 모든 작품의 기록 조회
        const keys = await kv.keys(`${KV_PREFIX}*`);
        const allRecords = [];
        
        for (const key of keys) {
          const records = await kv.get(key);
          if (Array.isArray(records)) {
            const titleFromKey = key.replace(KV_PREFIX, "");
            records.forEach((record) => {
              allRecords.push({ ...record, title: titleFromKey });
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
