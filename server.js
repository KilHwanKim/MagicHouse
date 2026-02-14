import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_BASE = "https://api.themoviedb.org/3";

app.use(express.json());

// 정적 파일: 프로젝트 루트 + tests 폴더
app.use(express.static(__dirname));
app.use("/tests", express.static(path.join(__dirname, "tests")));

// TMDB 검색 프록시 (API 키 노출 방지)
app.get("/api/tmdb/search", async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "TMDB_API_KEY is not set in .env" });
  }
  const q = (req.query.q || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const url = `${TMDB_BASE}/search/multi?api_key=${key}&query=${encodeURIComponent(q)}&language=ko-KR&page=${page}&include_adult=false`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OpenAI: TMDB overview로 질문 5개 생성
app.post("/api/generate-questions", async (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in .env" });
  }
  const { title, overview } = req.body || {};
  const overviewText = typeof overview === "string" ? overview.trim() : "";
  if (!overviewText) {
    return res.status(400).json({ error: "body.overview is required" });
  }

  const systemContent = `당신은 영화/애니 작품을 보고 시청자에게 던질 질문을 만드는 사람입니다.
주어진 작품 줄거리(overview)만 보고, 그 작품을 본 사람이 생각해 보면 좋을 질문을 정확히 5개 만들어 주세요.
- 질문은 반드시 한국어로만 작성하세요.
- 각 질문은 한 문장으로, 감상/추억/공감을 이끌어 내는 질문이어야 합니다.
- 응답은 반드시 JSON 배열 하나만 출력하세요. 다른 설명 없이 배열만 출력합니다.
- 형식: ["질문1", "질문2", "질문3", "질문4", "질문5"]`;

  const userContent = title
    ? `작품 제목: ${title}\n\n줄거리:\n${overviewText}`
    : `줄거리:\n${overviewText}`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || "OpenAI API error",
        details: data,
      });
    }

    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    let questions = [];
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed)
        ? parsed.filter((q) => typeof q === "string").slice(0, 5)
        : [];
    } catch {
      questions = raw.split("\n").filter((s) => s.trim()).slice(0, 5);
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`TMDB test: http://localhost:${PORT}/tests/tmdb.html`);
  console.log(`질문 생성 테스트: http://localhost:${PORT}/tests/generate-questions.html`);
});
