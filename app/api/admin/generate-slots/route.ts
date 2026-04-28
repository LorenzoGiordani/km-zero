import { NextRequest, NextResponse } from "next/server";
import { generateWeeklySlots } from "@/lib/algorithm/slot-generator";

export async function POST(request: NextRequest) {
  try {
    const result = await generateWeeklySlots();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
