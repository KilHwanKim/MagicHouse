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
  const promotionEnabled = process.env.AD_BANNER_ENABLED === "1";
  const promotionTitle = (process.env.AD_BANNER_TITLE || "").trim();
  const promotionBody = (process.env.AD_BANNER_BODY || "").trim();
  const promotionCta = (process.env.AD_BANNER_CTA || "").trim();
  const promotionUrl = (process.env.AD_BANNER_URL || "").trim();
  const feedbackFormUrl = (process.env.FEEDBACK_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSdh7hu20jRqcRAAGs0klcdO0mKaGnw2MDd7GmVI3I4uiJBb-A/viewform").trim();

  res.json({
    kakaoJsKey: process.env.KAKAO_JS_KEY || "",
    feedbackFormUrl,
    metricsEnabled: Boolean(process.env.METRICS_WEBHOOK_URL),
    promotion:
      promotionEnabled && promotionTitle && promotionBody && promotionCta && promotionUrl
        ? {
            label: (process.env.AD_BANNER_LABEL || "PROMOTION").trim() || "PROMOTION",
            title: promotionTitle,
            body: promotionBody,
            cta: promotionCta,
            url: promotionUrl,
          }
        : null,
    features: {
      tmdbSearch: Boolean(process.env.TMDB_API_KEY),
      aiQuestions: Boolean(process.env.OPENAI_API_KEY),
      kakaoShare: hasKakaoJsKey,
      kakaoLogin: hasKakaoJsKey && hasKakaoRestKey,
      sharedRecords: hasKvConfig,
    },
  });
}
