import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { optimizeRoute, RouteStop } from "@/lib/algorithm/route-optimizer";
import { calculateAvailableDate } from "@/lib/algorithm/slot-generator";

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    const targetDate = date || new Date().toISOString().split("T")[0];

    const supabase = await createClient();

    // Prendi ordini in attesa per quella data
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, pickup_point_id,
        pickup_points(name, lat, lng),
        order_items(product_id, quantity, products(name, unit_type, producer_id, profiles!inner(full_name, company_name, lat, lng)))
      `)
      .eq("status", "in_attesa")
      .order("created_at");

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: "Nessun ordine in attesa", route: null });
    }

    // Hub = primo pickup point attivo (o centroide Parma)
    const { data: hubPoint } = await supabase
      .from("pickup_points")
      .select("lat, lng, name")
      .eq("is_active", true)
      .limit(1)
      .single();

    const hub = hubPoint?.lat && hubPoint?.lng
      ? { lat: hubPoint.lat, lng: hubPoint.lng }
      : { lat: 44.8015, lng: 10.3280 };

    // Costruisci lista stop
    const producerMap = new Map<string, RouteStop>();
    const pickupMap = new Map<string, RouteStop>();

    for (const order of orders) {
      const pp = order.pickup_points as any;
      if (pp?.lat && pp?.lng) {
        const key = order.pickup_point_id;
        if (!pickupMap.has(key)) {
          pickupMap.set(key, {
            id: key,
            name: pp.name || "Punto ritiro",
            lat: pp.lat,
            lng: pp.lng,
            type: "pickup",
            orderCount: 0,
            prepDays: 0,
          });
        }
        pickupMap.get(key)!.orderCount++;
      }

      const items = order.order_items as any[];
      for (const item of items) {
        const prod = item.products?.profiles;
        if (prod?.lat && prod?.lng) {
          const pkey = item.products.producer_id;
          if (!producerMap.has(pkey)) {
            producerMap.set(pkey, {
              id: pkey,
              name: prod.company_name || prod.full_name || "Produttore",
              lat: prod.lat,
              lng: prod.lng,
              type: "producer",
              orderCount: 0,
              prepDays: item.products.unit_type === "kg" ? 2 : 1,
              availableDate: calculateAvailableDate(item.products.unit_type === "kg" ? 2 : 1),
            });
          }
          producerMap.get(pkey)!.orderCount++;
        }
      }
    }

    const allStops = [...producerMap.values(), ...pickupMap.values()];
    const route = optimizeRoute(allStops, hub);

    return NextResponse.json({
      hub: { name: hubPoint?.name || "Hub", lat: hub.lat, lng: hub.lng },
      route,
      totalOrders: orders.length,
      producerStops: route.collectionRoute.length,
      pickupStops: route.deliveryRoute.length,
      summary: {
        collection: route.collectionRoute.map((s) => ({
          name: s.name,
          orders: s.orderCount,
          availableDate: s.availableDate,
        })),
        delivery: route.deliveryRoute.map((s) => ({
          name: s.name,
          orders: s.orderCount,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
