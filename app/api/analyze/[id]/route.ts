import { NextResponse } from "next/server";
import { getAnalysisResult } from "@/lib/modules/analyze";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAnalysisResult(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
