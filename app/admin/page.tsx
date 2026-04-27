"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Order, OrderItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      supabase.from("profiles").select("role").eq("id", data.user.id).single().then(({ data: p }) => {
        if (p?.role !== "admin") { router.push("/"); return; }
        loadData();
      });
    });
  }, [supabase, router]);

  const loadData = async () => {
    setLoading(true);
    const { data: o } = await supabase.from("orders").select("*, pickup_points(name)").order("created_at", { ascending: false });
    const orderList = o ?? [];
    setOrders(orderList);

    if (orderList.length > 0) {
      const { data: items } = await supabase.from("order_items").select("*, products(name)").in("order_id", orderList.map((x) => x.id));
      const grouped: Record<string, OrderItem[]> = {};
      items?.forEach((i) => {
        grouped[i.order_id] = grouped[i.order_id] ?? [];
        grouped[i.order_id].push(i);
      });
      setOrderItems(grouped);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    toast.success("Stato aggiornato");
    loadData();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      in_attesa: "bg-yellow-100 text-yellow-800",
      confermato: "bg-green-100 text-green-800",
      in_consegna: "bg-blue-100 text-blue-800",
      completato: "bg-stone-100 text-stone-800",
    };
    return map[s] || "bg-stone-100 text-stone-800";
  };

  if (loading) return <div className="py-20 text-center">Caricamento...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">Dashboard Admin</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="border-stone-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-stone-500">Ordine {order.id.slice(0, 8)}</p>
                  <p className="text-sm font-medium">{order.pickup_points?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusBadge(order.status)}>{order.status.replace("_", " ")}</Badge>
                  <span className="font-semibold">€{formatPrice(order.total_amount + order.delivery_fee)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-stone-600">
                {(orderItems[order.id] ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.products?.name} × {item.quantity}</span>
                    <span>€{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                {order.status === "in_attesa" && (
                  <Button size="sm" onClick={() => updateStatus(order.id, "confermato")}>Conferma</Button>
                )}
                {order.status === "confermato" && (
                  <Button size="sm" onClick={() => updateStatus(order.id, "in_consegna")}>In consegna</Button>
                )}
                {order.status === "in_consegna" && (
                  <Button size="sm" onClick={() => updateStatus(order.id, "completato")}>Completato</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="py-8 text-center text-stone-500">Nessun ordine.</p>}
      </div>
    </div>
  );
}
