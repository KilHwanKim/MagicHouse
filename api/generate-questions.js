import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set in .env" });
  }
  const { title, overview, existingQA } = req.body || {};
  const overviewText = typeof overview === "string" ? overview.trim() : "";
  if (!overviewText) {
    return res.status(400).json({ error: "body.overview is required" });
  }

  const qaList = Array.isArray(existingQA)
    ? existingQA
        .filter((x) => x && typeof x.q === "string")
        .slice(-15)
        .map((x) => ({ q: String(x.q).trim(), a: typeof x.a === "string" ? String(x.a).trim() : "" }))
    : [];

  let systemContent;
  try {
    const promptPath = path.join(__dirname, "..", "prompts", "system-prompt.txt");
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

  const requestPayload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

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

    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || "OpenAI API error",
        details: data,
      });
    }

    let raw = data.choices?.[0]?.message?.content?.trim() || "";
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
      const fallback = raw
        .split("\n")
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
}
