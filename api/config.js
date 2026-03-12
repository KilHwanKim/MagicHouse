export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const hasKakaoJsKey = Boolean((process.env.KAKAO_JS_KEY || "").trim());
  const hasKakaoRestKey = Boolean((process.env.KAKAO_REST_API_KEY || "").trim());
  const hasKvConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  res.json({
    kakaoJsKey: process.env.KAKAO_JS_KEY || "",
    features: {
      tmdbSearch: Boolean(process.env.TMDB_API_KEY),
      aiQuestions: Boolean(process.env.OPENAI_API_KEY),
      kakaoShare: hasKakaoJsKey,
      kakaoLogin: hasKakaoJsKey && hasKakaoRestKey,
      sharedRecords: hasKvConfig,
    },
  });
}
