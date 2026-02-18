import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMDB_BASE = "https://api.themoviedb.org/3";

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
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

    const hasResults = data.results && data.results.length > 0;
    if (hasResults) {
      return res.json(data);
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.json(data);
    }

    let systemPrompt;
    try {
      const promptPath = path.join(__dirname, "..", "..", "prompts", "search-query-correction.txt");
      systemPrompt = readFileSync(promptPath, "utf-8").trim();
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
}
