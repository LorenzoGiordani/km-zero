"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CartItem, PickupPoint } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function CarrelloPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem("km0_cart");
    if (saved) setCart(JSON.parse(saved));
    supabase.from("pickup_points").select("*").eq("is_active", true).then(({ data }) => setPickupPoints(data ?? []));
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

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

  const total = cart.reduce((s, i) => s + i.product.price_per_kg * i.quantity, 0);
  const deliveryFee = selectedPickup ? 3.5 : 0;

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
        total_amount: total,
        delivery_fee: deliveryFee,
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
        <p className="py-12 text-center text-stone-500">Carrello vuoto.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <Card key={item.product.id} className="border-stone-200">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-stone-500">
                    €{formatPrice(item.product.price_per_kg)} / {item.product.unit_type}
                  </p>
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

          <div className="mt-4 space-y-2">
            <div>
              <label className="text-sm font-medium">Punto di ritiro</label>
              <select
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                value={selectedPickup ?? ""}
                onChange={(e) => setSelectedPickup(e.target.value || null)}
              >
                <option value="">Scegli punto ritiro</option>
                {pickupPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotale</span>
              <span>€{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Consegna</span>
              <span>€{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-lg font-bold">
              <span>Totale</span>
              <span>€{formatPrice(total + deliveryFee)}</span>
            </div>
            <Button className="w-full" onClick={handleOrder}>
              Conferma ordine — paga alla consegna
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
