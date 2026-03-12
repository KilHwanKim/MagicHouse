import { NextRequest, NextResponse } from "next/server";
import { searchTmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const page = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const result = await searchTmdb(query, page);

  return NextResponse.json(result.body, { status: result.status });
}
