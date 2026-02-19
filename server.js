import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { kv } from "@vercel/kv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_BASE = "https://api.themoviedb.org/3";

app.use(express.json());

// 정적 파일: 프로젝트 루트 + tests (Vercel은 buildCommand 없이 루트를 정적 서빙)
app.use(express.static(__dirname));
app.use("/tests", express.static(path.join(__dirname, "tests")));

// 카카오 공유용 설정 (클라이언트에서 사용)
app.get("/api/config", (req, res) => {
  res.json({
    kakaoJsKey: process.env.KAKAO_JS_KEY || "",
  });
});

// 카카오 로그인: 인가 코드를 액세스 토큰으로 교환
app.post("/api/kakao/token", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }
    
    const kakaoRestKey = process.env.KAKAO_REST_API_KEY;
    if (!kakaoRestKey) {
      return res.status(500).json({ error: "KAKAO_REST_API_KEY is not configured" });
    }
    
    // 클라이언트 시크릿 (선택사항, 활성화된 경우 필요)
    const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET;
    
    // Redirect URI 정확히 일치해야 함 (슬래시 없이)
    const finalRedirectUri = redirectUri || `${req.protocol}://${req.get("host")}`;
    
    console.log("[카카오 토큰 교환] 요청 정보:", {
      redirectUri: finalRedirectUri,
      hasCode: !!code,
      restKeyPrefix: kakaoRestKey.substring(0, 8) + "...",
      restKeyLength: kakaoRestKey.length,
      codeLength: code.length,
      hasClientSecret: !!kakaoClientSecret
    });
    
    // 카카오 토큰 교환 API 호출
    const requestParams = {
      grant_type: "authorization_code",
      client_id: kakaoRestKey,
      redirect_uri: finalRedirectUri,
      code: code,
    };
    
    // 클라이언트 시크릿이 있으면 추가 (카카오 개발자 콘솔에서 활성화된 경우)
    if (kakaoClientSecret) {
      requestParams.client_secret = kakaoClientSecret;
    }
    
    const requestBody = new URLSearchParams(requestParams);
    
    console.log("[카카오 토큰 교환] 요청 본문:", {
      grant_type: "authorization_code",
      client_id: kakaoRestKey.substring(0, 8) + "...",
      redirect_uri: finalRedirectUri,
      code: code.substring(0, 10) + "..."
    });
    
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("카카오 토큰 교환 실패:", errorData);
      console.error("사용된 Redirect URI:", finalRedirectUri);
      console.error("REST API 키 확인 필요:", kakaoRestKey ? "설정됨" : "없음");
      
      // KOE010 에러인 경우 상세 안내
      if (errorData.error_code === 'KOE010') {
        return res.status(tokenResponse.status).json({ 
          error: "invalid_client",
          error_description: "REST API 키가 잘못되었거나 카카오 개발자 콘솔 설정을 확인해주세요.",
          error_code: "KOE010",
          details: {
            message: "카카오 개발자 콘솔에서 다음을 확인하세요:",
            checks: [
              "1. 앱 설정 → 앱 키에서 REST API 키가 올바른지 확인",
              "2. 카카오 로그인 → Redirect URI에 정확히 일치하는 URI가 등록되어 있는지 확인",
              `3. 현재 사용된 Redirect URI: ${finalRedirectUri}`,
              "4. 플랫폼 → Web 플랫폼이 등록되어 있는지 확인"
            ]
          }
        });
      }
      
      return res.status(tokenResponse.status).json({ 
        error: "Failed to exchange token", 
        details: errorData 
      });
    }
    
    const tokenData = await tokenResponse.json();
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (err) {
    console.error("카카오 토큰 교환 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

// 카카오 사용자 정보 조회 (액세스 토큰 사용)
app.get("/api/kakao/user", async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace("Bearer ", "");
    
    if (!accessToken) {
      return res.status(401).json({ error: "Access token is required" });
    }
    
    // 카카오 사용자 정보 조회 API 호출
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error("카카오 사용자 정보 조회 실패:", errorData);
      return res.status(userResponse.status).json({ 
        error: "Failed to get user info", 
        details: errorData 
      });
    }
    
    const userData = await userResponse.json();
    res.json({
      id: userData.id,
      // 필요한 경우 다른 정보도 포함 가능
    });
  } catch (err) {
    console.error("카카오 사용자 정보 조회 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

async function correctQueryWithLLM(openaiKey, systemPrompt, userQuery) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      temperature: 0.3,
      max_tokens: 64,
    }),
  });
  const data = await r.json();
  if (!r.ok) return null;
  return (data.choices?.[0]?.message?.content || "").trim();
}

// TMDB 검색 프록시 (API 키 노출 방지)
app.get("/api/tmdb/search", async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "TMDB_API_KEY is not set in .env" });
  }
  let q = (req.query.q || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const buildUrl = (query) =>
    `${TMDB_BASE}/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&language=ko-KR&page=${page}&include_adult=false`;

  try {
    let r = await fetch(buildUrl(q));
    let data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    if (data.results && data.results.length > 0) {
      return res.json(data);
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.json(data);
    }

    let systemPrompt;
    try {
      systemPrompt = readFileSync(path.join(__dirname, "prompts", "search-query-correction.txt"), "utf-8").trim();
    } catch {
      return res.json(data);
    }

    const corrected = await correctQueryWithLLM(openaiKey, systemPrompt, q);
    if (!corrected || corrected === q) {
      return res.json(data);
    }

    r = await fetch(buildUrl(corrected));
    data = await r.json();
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
  const { title, overview, existingQA } = req.body || {};
  const overviewText = typeof overview === "string" ? overview.trim() : "";
  if (!overviewText) {
    return res.status(400).json({ error: "body.overview is required" });
  }

  // 기존 Q&A (optional)
  const qaList = Array.isArray(existingQA)
    ? existingQA
        .filter((x) => x && typeof x.q === "string")
        .slice(-15)
        .map((x) => ({ q: String(x.q).trim(), a: typeof x.a === "string" ? String(x.a).trim() : "" }))
    : [];

  // 시스템 프롬프트 파일 읽기
  let systemContent;
  try {
    const promptPath = path.join(__dirname, "prompts", "system-prompt.txt");
    systemContent = readFileSync(promptPath, "utf-8").trim();
  } catch (error) {
    console.error("프롬프트 파일 읽기 실패:", error);
    return res.status(500).json({ error: "프롬프트 파일을 읽을 수 없습니다." });
  }

  let userContent = title
    ? `작품 제목: ${title}\n\n줄거리:\n${overviewText}`
    : `줄거리:\n${overviewText}`;

  if (qaList.length > 0) {
    const qaBlock = qaList
      .map((item) => `Q. ${item.q}\nA. ${item.a || "(미작성)"}`)
      .join("\n\n");
    userContent += `\n\n[기존 Q&A - 아래와 중복되지 않도록 하세요. 답변이 있는 경우, 그 답변을 바탕으로 꼬리질문(후속 질문)을 생성해도 됩니다]\n${qaBlock}`;
  }

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
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        // LLM이 문자열 중간에 줄바꿈을 넣은 경우(예: "미 \n츠하의 사진") 재시도
        parsed = JSON.parse(raw.replace(/\r?\n/g, " "));
      }
      if (!Array.isArray(parsed)) {
        questions = [];
      } else {
        questions = parsed.slice(0, 5).map((item) => {
          if (typeof item === "string") {
            return { q: item.trim(), options: undefined };
          }
          if (item && typeof item === "object" && typeof item.q === "string") {
            const opts = Array.isArray(item.options)
              ? item.options
                  .filter((o) => typeof o === "string")
                  .map((o) => String(o).replace(/\s+/g, " ").trim())
                  .filter(Boolean)
                  .slice(0, 10)
              : undefined;
            return { q: item.q.trim(), options: opts?.length ? opts : undefined };
          }
          return null;
        }).filter(Boolean);
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 줄바꿈으로 분리 시도
      console.warn("JSON 파싱 실패, 줄바꿈으로 분리 시도:", parseError.message);
      const fallback = raw.split("\n")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("```") && s.length > 0)
        .slice(0, 5)
        .map((s) => ({ q: s.replace(/^["']|["']$/g, ""), options: undefined }));
      questions = fallback;
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Vercel KV: 공유 기록 저장/조회/삭제 ==========
const KV_PREFIX = "shared_records:";

// 공유 기록 추가
app.post("/api/shared-records", async (req, res) => {
  try {
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

    res.json({ success: true, recordId });
  } catch (err) {
    console.error("KV 저장 실패:", err);
    res.status(500).json({ error: err.message });
  }
});

// 공유 기록 조회 (작품별 또는 전체)
app.get("/api/shared-records", async (req, res) => {
  try {
    const { title } = req.query;
    
    if (title) {
      // 특정 작품의 기록만 조회
      const key = `${KV_PREFIX}${title}`;
      const records = await kv.get(key);
      res.json({ records: Array.isArray(records) ? records : [] });
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
      res.json({ records: allRecords });
    }
  } catch (err) {
    console.error("KV 조회 실패:", err);
    res.status(500).json({ error: err.message });
  }
});

// 공유 기록 삭제
app.delete("/api/shared-records", async (req, res) => {
  try {
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

    res.json({ success: true });
  } catch (err) {
    console.error("KV 삭제 실패:", err);
    res.status(500).json({ error: err.message });
  }
});

// 작품 목록 조회 (공유 기록이 있는 작품들)
app.get("/api/shared-records/titles", async (req, res) => {
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
    
    res.json({ titles });
  } catch (err) {
    console.error("KV 작품 목록 조회 실패:", err);
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
    console.log(`카카오 공유 테스트: http://localhost:${PORT}/tests/kakao-share.html`);
    console.log(`공유 기록 테스트: http://localhost:${PORT}/tests/shared-records.html`);
    console.log(`Vercel KV 공유 기록 테스트: http://localhost:${PORT}/tests/vercel-kv-shared-records.html`);
  });
}

export default app;
