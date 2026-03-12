export type FeatureFlags = {
  tmdbSearch: boolean;
  aiQuestions: boolean;
  kakaoShare: boolean;
  kakaoLogin: boolean;
  sharedRecords: boolean;
};

export type FeatureConfig = {
  kakaoJsKey: string;
  promotion: {
    label: string;
    title: string;
    body: string;
    cta: string;
    url: string;
  } | null;
  auth: {
    email: boolean;
    google: boolean;
    kakao: boolean;
  };
  features: FeatureFlags;
};

export function getFeatureConfig(): FeatureConfig {
  const kakaoJsKey = process.env.KAKAO_JS_KEY?.trim() ?? "";
  const kakaoRestKey = process.env.KAKAO_REST_API_KEY?.trim() ?? "";
  const promotionEnabled = process.env.AD_BANNER_ENABLED === "1";
  const promotionTitle = process.env.AD_BANNER_TITLE?.trim() ?? "";
  const promotionBody = process.env.AD_BANNER_BODY?.trim() ?? "";
  const promotionCta = process.env.AD_BANNER_CTA?.trim() ?? "";
  const promotionUrl = process.env.AD_BANNER_URL?.trim() ?? "";

  return {
    kakaoJsKey,
    promotion:
      promotionEnabled &&
      promotionTitle &&
      promotionBody &&
      promotionCta &&
      promotionUrl
        ? {
            label: process.env.AD_BANNER_LABEL?.trim() || "PROMOTION",
            title: promotionTitle,
            body: promotionBody,
            cta: promotionCta,
            url: promotionUrl,
          }
        : null,
    auth: {
      email: process.env.AUTH_EMAIL_ENABLED === "1",
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID?.trim() &&
          process.env.GOOGLE_CLIENT_SECRET?.trim(),
      ),
      kakao: Boolean(kakaoJsKey && kakaoRestKey),
    },
    features: {
      tmdbSearch: Boolean(process.env.TMDB_API_KEY),
      aiQuestions: Boolean(process.env.OPENAI_API_KEY),
      kakaoShare: Boolean(kakaoJsKey),
      kakaoLogin: Boolean(kakaoJsKey && kakaoRestKey),
      sharedRecords: Boolean(
        process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
      ),
    },
  };
}
