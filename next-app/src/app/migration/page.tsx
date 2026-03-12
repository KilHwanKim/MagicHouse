import { SectionCard } from "@/components/section-card";

const tracks = [
  {
    name: "제품 구조",
    items: [
      "작품 상세, 공유 페이지, 내 서재를 URL 기반 라우트로 분리",
      "현재 title 기반 데이터를 workId 기반 모델로 치환",
      "공개 페이지와 로그인 페이지를 분리해 SEO와 개인화 충돌 제거",
    ],
  },
  {
    name: "백엔드 전환",
    items: [
      "Express `/api/config`를 Next Route Handler로 이관",
      "TMDB · OpenAI · 공유 기록을 서버 함수 기준으로 재정리",
      "KV 의존은 Redis/Postgres 조합으로 재설계",
    ],
  },
  {
    name: "사업화 준비",
    items: [
      "이메일/Google 기반 계정과 결제 플로우 추가",
      "공유 페이지 OG 이미지와 유입 로그 수집",
      "무료/광고형/구독형 실험을 위한 플랜 분리",
    ],
  },
];

export default function MigrationPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div>
        <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
          Migration Notes
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Next.js 이관 로드맵
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          기존 프로토타입을 한 번에 교체하기보다, 공개 화면과 서버 라우트부터 Next.js로
          흡수하는 전략을 전제로 한 초안입니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tracks.map((track) => (
          <SectionCard key={track.name} title={track.name}>
            <ul className="space-y-3 text-sm leading-6 text-slate-200">
              {track.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-sky-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    </main>
  );
}
