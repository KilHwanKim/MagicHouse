"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

type CampaignTrackerProps = {
  campaignSlug: string;
};

export function CampaignTracker({ campaignSlug }: CampaignTrackerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const payload = {
      event: "campaign_landing_viewed",
      page: `/campaigns/${campaignSlug}`,
      anonymousId: getAnonymousId(),
      properties: {
        campaignSlug,
        utm_source: searchParams.get("utm_source") || "",
        utm_medium: searchParams.get("utm_medium") || "",
        utm_campaign: searchParams.get("utm_campaign") || "",
        utm_content: searchParams.get("utm_content") || "",
      },
    };

    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [campaignSlug, searchParams]);

  return null;
}

function getAnonymousId() {
  const existing = window.localStorage.getItem("magic_house_next_anon_id");
  if (existing) return existing;

  const nextId = `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  window.localStorage.setItem("magic_house_next_anon_id", nextId);
  return nextId;
}
