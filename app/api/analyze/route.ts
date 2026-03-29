import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/modules/analyze";
import { urlInputSchema } from "@/lib/modules/url-intake";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = urlInputSchema.parse(body);
    const analysisId = await runAnalysis(parsed.inputUrl);
    return NextResponse.json({ analysisId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
