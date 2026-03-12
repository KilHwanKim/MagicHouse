import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/question-generator";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = await generateQuestions(body);

  return NextResponse.json(result.body, { status: result.status });
}
