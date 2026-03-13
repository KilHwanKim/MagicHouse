import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { campaignDefinitions } from "@/lib/campaigns";

export default function CampaignsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div>
        <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
          Campaign Hub
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          1차 유입 실험 랜딩 모음
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          커뮤니티, SNS, 모임 제안용으로 바로 써볼 수 있는 랜딩 페이지 모음입니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {campaignDefinitions.map((campaign) => (
          <SectionCard key={campaign.slug} title={campaign.label} description={campaign.description}>
            <h2 className="text-lg font-semibold text-white">{campaign.headline}</h2>
            <Link
              href={`/campaigns/${campaign.slug}`}
              className="mt-5 inline-flex rounded-full border border-sky-300/30 bg-sky-400/15 px-5 py-3 text-sm font-semibold text-sky-50 transition hover:bg-sky-400/20"
            >
              랜딩 열기
            </Link>
          </SectionCard>
        ))}
      </div>
    </main>
  );
}
