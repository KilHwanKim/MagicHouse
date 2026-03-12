import { loadPromptFile } from "@/lib/prompt-loader";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function correctQueryWithLLM(userQuery: string) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return null;
  }

  const systemPrompt = (await loadPromptFile("search-query-correction.txt")).trim();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await response.json();
  if (!response.ok) {
    return null;
  }

  return (data.choices?.[0]?.message?.content || "").trim();
}

export async function searchTmdb(query: string, page = 1) {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) {
    return {
      status: 500,
      body: { error: "TMDB_API_KEY is not set in .env" },
    };
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      status: 400,
      body: { error: "Query parameter 'q' is required" },
    };
  }

  const safePage = Math.max(1, page || 1);
  const buildUrl = (value: string) =>
    `${TMDB_BASE}/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(value)}&language=ko-KR&page=${safePage}&include_adult=false`;

  try {
    let response = await fetch(buildUrl(trimmedQuery));
    let data = await response.json();

    if (!response.ok) {
      return { status: response.status, body: data };
    }

    if (Array.isArray(data.results) && data.results.length > 0) {
      return { status: 200, body: data };
    }

    const corrected = await correctQueryWithLLM(trimmedQuery);
    if (!corrected || corrected === trimmedQuery) {
      return { status: 200, body: data };
    }

    response = await fetch(buildUrl(corrected));
    data = await response.json();

    if (!response.ok) {
      return { status: response.status, body: data };
    }

    return { status: 200, body: data };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}
