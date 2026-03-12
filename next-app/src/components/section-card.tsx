import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
