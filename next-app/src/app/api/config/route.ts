import { NextResponse } from "next/server";
import { getFeatureConfig } from "@/lib/feature-config";

export async function GET() {
  return NextResponse.json(getFeatureConfig());
}
