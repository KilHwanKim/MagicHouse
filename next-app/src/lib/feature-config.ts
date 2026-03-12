export type FeatureFlags = {
  tmdbSearch: boolean;
  aiQuestions: boolean;
  kakaoShare: boolean;
  kakaoLogin: boolean;
  sharedRecords: boolean;
};

export type FeatureConfig = {
  kakaoJsKey: string;
  features: FeatureFlags;
};

export function getFeatureConfig(): FeatureConfig {
  const kakaoJsKey = process.env.KAKAO_JS_KEY?.trim() ?? "";
  const kakaoRestKey = process.env.KAKAO_REST_API_KEY?.trim() ?? "";

  return {
    kakaoJsKey,
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
