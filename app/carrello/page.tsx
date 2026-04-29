"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CartItem, PickupPoint, DeliverySlot } from "@/lib/types";
import { formatPrice, haversineDistance, calculateCO2, calculateDeliveryFee, formatCO2 } from "@/lib/utils";
import { Trash2, Leaf, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MOCK_PICKUP_POINTS, MOCK_DELIVERY_SLOTS } from "@/lib/mock-data";

export default function CarrelloPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem("km0_cart");
    if (saved) setCart(JSON.parse(saved));
    supabase.from("pickup_points").select("*").eq("is_active", true).then(({ data }) => setPickupPoints(data?.length ? data : MOCK_PICKUP_POINTS));
    supabase.from("system_config").select("*").then(({ data }) => {
      const cfg: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));
      setSystemConfig(cfg);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    if (selectedPickup) {
      supabase
        .from("delivery_slots")
        .select("*")
        .eq("pickup_point_id", selectedPickup)
        .eq("is_active", true)
        .gte("delivery_date", new Date().toISOString().split("T")[0])
        .order("delivery_date")
        .then(({ data }) => {
          if (data?.length) {
            setDeliverySlots(data);
          } else {
            const mock = MOCK_DELIVERY_SLOTS.filter(s => s.pickup_point_id === selectedPickup);
            setDeliverySlots(mock);
          }
        });
    } else {
      setDeliverySlots([]);
      setSelectedSlot(null);
    }
  }, [selectedPickup]);

  useEffect(() => {
    localStorage.setItem("km0_cart", JSON.stringify(cart));
  }, [cart]);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Calcolo distanza media ponderata dai produttori al punto ritiro
  const calcRouteMetrics = () => {
    const pickup = pickupPoints.find((p) => p.id === selectedPickup);
    if (!pickup || !pickup.lat || !pickup.lng) return { totalDist: 0, maxDist: 0 };

    let totalDist = 0;
    let maxDist = 0;
    let count = 0;

    cart.forEach((item) => {
      const plat = item.product.profiles?.lat;
      const plng = item.product.profiles?.lng;
      if (plat && plng) {
        const dist = haversineDistance(pickup.lat!, pickup.lng!, plat, plng);
        totalDist += dist;
        if (dist > maxDist) maxDist = dist;
        count++;
      }
    });

    return { totalDist: count > 0 ? totalDist / count : 0, maxDist };
  };

  const subtotal = cart.reduce((s, i) => s + i.product.price_per_kg * i.quantity, 0);
  const { maxDist } = calcRouteMetrics();
  const { fee: deliveryFee, discount } = calculateDeliveryFee(maxDist, cart.length);
  const { co2Kg, co2Cost } = calculateCO2(maxDist, parseFloat(systemConfig.co2_kg_per_km || "0.15"));
  const total = subtotal + deliveryFee;

  const handleOrder = async () => {
    if (!user) {
      toast.error("Devi accedere per ordinare");
      router.push("/login");
      return;
    }
    if (!selectedPickup) {
      toast.error("Scegli un punto di ritiro");
      return;
    }
    if (cart.length === 0) {
      toast.error("Carrello vuoto");
      return;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        pickup_point_id: selectedPickup,
        total_amount: subtotal,
        delivery_fee: deliveryFee,
        co2_kg: co2Kg,
        co2_cost: co2Cost,
        delivery_discount: discount,
        delivery_slot_id: selectedSlot || null,
        status: "in_attesa",
      })
      .select()
      .single();

    if (error || !order) {
      toast.error("Errore creazione ordine");
      return;
    }

    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      price_per_kg: i.product.price_per_kg,
      subtotal: i.product.price_per_kg * i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) {
      toast.error("Errore salvataggio articoli");
      return;
    }

    setCart([]);
    localStorage.removeItem("km0_cart");
    toast.success("Ordine inviato! Riceverai conferma via email.");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">Il tuo carrello</h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Image
            src="/images/generated/empty-cart.webp"
            alt="Carrello vuoto"
            width={192}
            height={192}
            className="object-contain opacity-70 animate-float-pulse"
          />
          <p className="mt-6 text-center text-muted-foreground">
            Il tuo carrello è vuoto. <Link href="/catalogo" className="text-primary underline underline-offset-2">Sfoglia il catalogo</Link> per trovare prodotti della tua zona.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item, i) => (
            <Card key={item.product.id} className="border-border animate-reveal-up transition-all duration-300 hover:shadow-md" style={{ animationDelay: `${i * 80}ms` }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    €{formatPrice(item.product.price_per_kg)} / {item.product.unit_type}
                  </p>
                  {item.product.profiles?.company_name && (
                    <p className="text-xs text-muted-foreground/70">{item.product.profiles.company_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQty(item.product.id, -1)}>-</Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateQty(item.product.id, 1)}>+</Button>
                  </div>
                  <span className="min-w-[4rem] text-right font-semibold">
                    €{formatPrice(item.product.price_per_kg * item.quantity)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(item.product.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Truck className="h-4 w-4" /> Punto di ritiro
              </label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                value={selectedPickup ?? ""}
                onChange={(e) => setSelectedPickup(e.target.value || null)}
              >
                <option value="">Scegli punto ritiro</option>
                {pickupPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {deliverySlots.length > 0 && (
              <div>
                <label className="text-sm font-medium">Slot consegna</label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                  value={selectedSlot ?? ""}
                  onChange={(e) => setSelectedSlot(e.target.value || null)}
                >
                  <option value="">Qualsiasi data disponibile</option>
                  {deliverySlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.delivery_date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })} — {s.time_start}-{s.time_end}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotale prodotti</span>
                <span>€{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Consegna
                  {maxDist > 0 && <span className="text-xs text-muted-foreground">(~{maxDist.toFixed(1)} km)</span>}
                </span>
                <span>€{formatPrice(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Sconto multi-prodotto</span>
                  <span>-€{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Leaf className="h-3 w-3" /> Impatto CO₂
                </span>
                <span>{formatCO2(co2Kg)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Totale</span>
                <span>€{formatPrice(total)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleOrder}>
              Conferma ordine — paga alla consegna
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
