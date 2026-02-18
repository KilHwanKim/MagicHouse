import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_BASE = "https://api.themoviedb.org/3";

app.use(express.json());

// 정적 파일: 프로젝트 루트 + tests (Vercel은 buildCommand 없이 루트를 정적 서빙)
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

  // 시스템 프롬프트 파일 읽기
  let systemContent;
  try {
    const promptPath = path.join(__dirname, "prompts", "system-prompt.txt");
    systemContent = readFileSync(promptPath, "utf-8").trim();
  } catch (error) {
    console.error("프롬프트 파일 읽기 실패:", error);
    return res.status(500).json({ error: "프롬프트 파일을 읽을 수 없습니다." });
  }

  const userContent = title
    ? `작품 제목: ${title}\n\n줄거리:\n${overviewText}`
    : `줄거리:\n${overviewText}`;

  // ========== 테스트용 로그 (운영 시 삭제 필요) ==========
  console.log("=== OpenAI API 호출 시작 ===");
  console.log("Request URL: https://api.openai.com/v1/chat/completions");
  console.log("Model: gpt-4o");
  console.log("\n[System Message]:");
  console.log(systemContent);
  console.log("\n[User Message]:");
  console.log(userContent);
  console.log("\n[Request Payload]:");
  const requestPayload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };
  console.log(JSON.stringify(requestPayload, null, 2));
  console.log("=====================================");
  // ========================================================

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await r.json();
    
    // ========== 테스트용 로그 (운영 시 삭제 필요) ==========
    console.log("=== OpenAI API 응답 ===");
    console.log("Status:", r.status, r.statusText);
    console.log("Response Headers:", Object.fromEntries(r.headers.entries()));
    console.log("\n[Response Data]:");
    console.log(JSON.stringify(data, null, 2));
    if (data.choices?.[0]?.message?.content) {
      console.log("\n[Assistant Message]:");
      console.log(data.choices[0].message.content);
    }
    if (data.usage) {
      console.log("\n[Token Usage]:");
      console.log(`  Prompt tokens: ${data.usage.prompt_tokens}`);
      console.log(`  Completion tokens: ${data.usage.completion_tokens}`);
      console.log(`  Total tokens: ${data.usage.total_tokens}`);
    }
    console.log("=====================================");
    // ========================================================

    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || "OpenAI API error",
        details: data,
      });
    }

    let raw = data.choices?.[0]?.message?.content?.trim() || "";
    
    // 마크다운 코드 블록 제거 (```json ... ``` 형식)
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    
    let questions = [];
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed)
        ? parsed.filter((q) => typeof q === "string").slice(0, 5)
        : [];
    } catch (parseError) {
      // JSON 파싱 실패 시 줄바꿈으로 분리 시도
      console.warn("JSON 파싱 실패, 줄바꿈으로 분리 시도:", parseError.message);
      questions = raw.split("\n")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("```") && s.length > 0)
        .slice(0, 5);
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vercel 서버리스에서는 listen 하지 않음
if (typeof process !== "undefined" && process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`TMDB test: http://localhost:${PORT}/tests/tmdb.html`);
    console.log(`질문 생성 테스트: http://localhost:${PORT}/tests/generate-questions.html`);
    console.log(`로컬 스토리지 테스트: http://localhost:${PORT}/tests/local-storage.html`);
    console.log(`광고 테스트: http://localhost:${PORT}/tests/ad.html`);
  });
}

export default app;
