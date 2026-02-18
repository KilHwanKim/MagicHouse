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
  const { title, overview } = req.body || {};
  const overviewText = typeof overview === "string" ? overview.trim() : "";
  if (!overviewText) {
    return res.status(400).json({ error: "body.overview is required" });
  }

  let systemContent;
  try {
    const promptPath = path.join(__dirname, "..", "prompts", "system-prompt.txt");
    systemContent = readFileSync(promptPath, "utf-8").trim();
  } catch (error) {
    console.error("프롬프트 파일 읽기 실패:", error);
    return res.status(500).json({ error: "프롬프트 파일을 읽을 수 없습니다." });
  }

  const userContent = title
    ? `작품 제목: ${title}\n\n줄거리:\n${overviewText}`
    : `줄거리:\n${overviewText}`;

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
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed)
        ? parsed.filter((q) => typeof q === "string").slice(0, 5)
        : [];
    } catch (parseError) {
      questions = raw
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("```") && s.length > 0)
        .slice(0, 5);
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
