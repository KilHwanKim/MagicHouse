import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignTracker } from "@/components/campaign-tracker";
import { SectionCard } from "@/components/section-card";
import { getCampaign } from "@/lib/campaigns";

type CampaignPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaign = getCampaign(slug);

  if (!campaign) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
      <CampaignTracker campaignSlug={campaign.slug} />

      <section className="overflow-hidden rounded-[2rem] border border-sky-400/20 bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-fuchsia-500/10 p-8 shadow-2xl shadow-sky-950/30">
        <p className="text-sm font-semibold tracking-[0.25em] text-sky-200/80 uppercase">
          {campaign.label}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {campaign.headline}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200/90">
          {campaign.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={campaign.ctaHref}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {campaign.ctaLabel}
          </Link>
          <Link
            href="/campaigns"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            다른 랜딩 보기
          </Link>
        </div>
      </section>

      <SectionCard title="왜 이 서비스인가">
        <ul className="space-y-3 text-sm leading-6 text-slate-200">
          {campaign.bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-sky-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </main>
  );
}
