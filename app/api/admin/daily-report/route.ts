import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { date } = await request.json();
    const reportDate = date || new Date().toISOString().split("T")[0];

    // Conta ordini per stato
    const { data: orders } = await supabase
      .from("orders")
      .select("status, total_amount, delivery_fee, delivery_discount, co2_kg")
      .order("created_at");

    const today = reportDate;
    const todayOrders = (orders ?? []).filter((o: any) => {
      const createdAt = o.created_at?.split("T")[0];
      return createdAt === today;
    });

    const pickupsPlanned = todayOrders.length;
    const completedOrders = todayOrders.filter((o: any) => o.status === "completato");
    const pickupsDone = completedOrders.length;
    const deliveriesPlanned = todayOrders.length;
    const deliveriesDone = completedOrders.length;
    const cashIn = completedOrders.reduce((s: number, o: any) =>
      s + (o.total_amount || 0) + (o.delivery_fee || 0) - (o.delivery_discount || 0), 0
    );

    const { error } = await supabase.from("daily_reports").upsert({
      report_date: reportDate,
      pickups_planned: pickupsPlanned,
      pickups_done: pickupsDone,
      deliveries_planned: deliveriesPlanned,
      deliveries_done: deliveriesDone,
      cash_in: cashIn,
      cash_out: 0,
      is_closed: false,
    }, { onConflict: "report_date" });

    if (error) throw error;

    return NextResponse.json({
      report_date: reportDate,
      pickups_planned: pickupsPlanned,
      pickups_done: pickupsDone,
      deliveries_planned: deliveriesPlanned,
      deliveries_done: deliveriesDone,
      cash_in: cashIn,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(7);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
