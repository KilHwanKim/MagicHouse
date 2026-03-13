export type CampaignDefinition = {
  slug: string;
  label: string;
  headline: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const campaignDefinitions: CampaignDefinition[] = [
  {
    slug: "anime-club",
    label: "Anime Community",
    headline: "작품 감상 후 질문과 답을 책처럼 남기는 서고",
    description:
      "애니와 영화를 보고 그냥 별점만 남기지 않고, 질문과 생각까지 기록해두고 싶은 사람을 위한 랜딩입니다.",
    bullets: [
      "한 작품마다 질문과 답을 쌓아 책처럼 기록",
      "AI가 후속 질문을 만들어 더 깊게 생각하게 도움",
      "공유 링크로 감상 노트를 다른 사람과 바로 나눔",
    ],
    ctaLabel: "서고 들어가기",
    ctaHref: "/",
  },
  {
    slug: "social-reflection",
    label: "Social Reflection",
    headline: "재밌었다로 끝내지 말고, 생각까지 남겨보세요",
    description:
      "SNS 유입용 메시지입니다. 감상 후의 생각을 한 줄 평이 아니라 기록 습관으로 바꾸는 데 초점을 맞춥니다.",
    bullets: [
      "질문 기반 기록으로 감상을 오래 남김",
      "작품별 회고 노트를 나만의 서재처럼 정리",
      "나중에 다시 봐도 생각의 흐름이 남아 있음",
    ],
    ctaLabel: "기록 시작하기",
    ctaHref: "/",
  },
  {
    slug: "film-study",
    label: "Film Study",
    headline: "영화 모임 질문지와 회고 노트를 한 번에",
    description:
      "동아리, 스터디, 소규모 감상 모임에 맞춘 랜딩입니다. 질문 생성과 기록 공유를 한 번에 전달합니다.",
    bullets: [
      "모임 전에 질문을 준비하고",
      "모임 후에는 답과 토론 포인트를 정리하고",
      "공유 링크로 멤버들에게 다시 배포할 수 있음",
    ],
    ctaLabel: "실험실 보기",
    ctaHref: "/lab",
  },
];

export function getCampaign(slug: string) {
  return campaignDefinitions.find((campaign) => campaign.slug === slug) || null;
}
