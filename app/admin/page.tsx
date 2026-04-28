"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Order, OrderItem } from "@/lib/types";
import { formatPrice, formatCO2 } from "@/lib/utils";
import {
  Route,
  MapPin,
  Package,
  Calendar,
  Truck,
  Leaf,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Bell,
} from "lucide-react";

interface RouteData {
  hub: { name: string; lat: number; lng: number };
  route: {
    collectionRoute: { id: string; name: string; lat: number; lng: number; orderCount: number; availableDate?: string; prepDays: number }[];
    deliveryRoute: { id: string; name: string; lat: number; lng: number; orderCount: number }[];
    totalKm: number;
    estimatedDuration: number;
    collectionDate: string;
    deliveryDate: string;
  };
  totalOrders: number;
  summary: {
    collection: { name: string; orders: number; availableDate?: string }[];
    delivery: { name: string; orders: number }[];
  };
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [generatingReport, setGeneratingReport] = useState(false);
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
    const { data: o } = await supabase
      .from("orders")
      .select("*, pickup_points(name), delivery_slots(delivery_date, time_start, time_end)")
      .order("created_at", { ascending: false });
    const orderList = o ?? [];
    setOrders(orderList);

    if (orderList.length > 0) {
      const { data: items } = await supabase
        .from("order_items")
        .select("*, products(name)")
        .in("order_id", orderList.map((x) => x.id));
      const grouped: Record<string, OrderItem[]> = {};
      items?.forEach((i) => {
        grouped[i.order_id] = grouped[i.order_id] ?? [];
        grouped[i.order_id].push(i);
      });
      setOrderItems(grouped);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, orderData?: any) => {
    await supabase.from("orders").update({ status }).eq("id", id);

    // Crea notifica per il cliente quando confermato
    if (status === "confermato" && orderData?.customer_id) {
      const deliverySlot = orderData.delivery_slots;
      const dateMsg = deliverySlot
        ? `Consegna prevista: ${new Date(deliverySlot.delivery_date).toLocaleDateString("it-IT")}`
        : "La data di consegna ti verrà comunicata a breve.";
      await supabase.from("notifications").insert({
        user_id: orderData.customer_id,
        title: "Ordine confermato",
        message: `Il tuo ordine è stato confermato! ${dateMsg}. Preparati a ricevere prodotti freschi a km zero.`,
        type: "success",
        order_id: id,
      });
    }

    toast.success("Stato aggiornato");
    loadData();
  };

  const handleGenerateSlots = async () => {
    setGeneratingSlots(true);
    try {
      const res = await fetch("/api/admin/generate-slots", { method: "POST" });
      const data = await res.json();
      toast.success(`Slot generati: ${data.created}`);
    } catch {
      toast.error("Errore generazione slot");
    } finally {
      setGeneratingSlots(false);
    }
  };

  const handleOptimizeRoute = async () => {
    setCalculatingRoute(true);
    try {
      const res = await fetch("/api/admin/optimize-route", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json();
      if (data.route) {
        setRouteData(data);
        toast.success(`Percorso ottimizzato: ${Math.round(data.route.totalKm)} km`);
      } else {
        toast.info(data.message || "Nessun ordine da ottimizzare");
      }
    } catch {
      toast.error("Errore calcolo percorso");
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/admin/daily-report", { method: "POST", body: JSON.stringify({}) });
      await res.json();
      toast.success("Report giornaliero generato");
    } catch {
      toast.error("Errore");
    } finally {
      setGeneratingReport(false);
    }
  };

  const toggleOrder = (id: string) => {
    const next = new Set(expandedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedOrders(next);
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

  const pendingOrders = orders.filter((o) => o.status === "in_attesa");
  const confirmedOrders = orders.filter((o) => o.status === "confermato" || o.status === "in_consegna");
  const completedOrders = orders.filter((o) => o.status === "completato");

  const totalCO2 = orders.reduce((s, o) => s + (o.co2_kg || 0), 0);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Caricamento...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 font-serif text-3xl font-bold">Dashboard Admin</h1>
      <p className="mb-8 text-sm text-muted-foreground">Gestione ordini, routing e consegne</p>

      {/* Stats bar */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "In attesa", value: pendingOrders.length, icon: Calendar },
          { label: "In corso", value: confirmedOrders.length, icon: Truck },
          { label: "Completati", value: completedOrders.length, icon: Package },
          { label: "CO₂ totale", value: formatCO2(totalCO2), icon: Leaf },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button
          onClick={handleOptimizeRoute}
          disabled={calculatingRoute}
          className="font-serif"
        >
          <Route className="mr-2 h-4 w-4" />
          {calculatingRoute ? "Calcolo..." : "Ottimizza percorso"}
        </Button>
        <Button
          variant="outline"
          onClick={handleGenerateSlots}
          disabled={generatingSlots}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generatingSlots ? "animate-spin" : ""}`} />
          {generatingSlots ? "Generazione..." : "Genera slot consegna"}
        </Button>
        <Button
          variant="outline"
          onClick={handleGenerateReport}
          disabled={generatingReport}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          {generatingReport ? "Generazione..." : "Consuntiva giornata"}
        </Button>
      </div>

      {/* Route result */}
      {routeData && (
        <Card className="mb-8 border-accent/30 bg-accent/5">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Route className="h-5 w-5 text-accent" />
              Percorso Ottimizzato
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Collection route */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-accent mb-3">
                  🚛 Ritiro Produttori ({routeData.route.collectionDate})
                </h3>
                <ol className="space-y-2">
                  <li className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Partenza: {routeData.hub.name}
                  </li>
                  {routeData.summary.collection.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-1">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.orders} ordini</span>
                    </li>
                  ))}
                  <li className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Rientro: {routeData.hub.name}
                  </li>
                </ol>
              </div>

              {/* Delivery route */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">
                  📦 Consegna ({routeData.route.deliveryDate})
                </h3>
                <ol className="space-y-2">
                  <li className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Partenza: {routeData.hub.name}
                  </li>
                  {routeData.summary.delivery.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-1">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white font-bold">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.orders} ordini</span>
                    </li>
                  ))}
                  <li className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Rientro: {routeData.hub.name}
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-4 flex gap-6 text-sm text-muted-foreground border-t border-border pt-4">
              <span>Totale: <strong>{Math.round(routeData.route.totalKm)} km</strong></span>
              <span>Stimato: <strong>{routeData.route.estimatedDuration.toFixed(1)} ore</strong></span>
              <span>Ordini: <strong>{routeData.totalOrders}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending orders */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-bold mb-4">
          Ordini in attesa ({pendingOrders.length})
        </h2>
        <div className="space-y-3">
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              items={orderItems[order.id] ?? []}
              expanded={expandedOrders.has(order.id)}
              onToggle={() => toggleOrder(order.id)}
              onStatus={updateStatus}
              statusBadge={statusBadge}
            />
          ))}
          {pendingOrders.length === 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">Nessun ordine in attesa.</p>
          )}
        </div>
      </div>

      {/* Other orders */}
      {[...confirmedOrders, ...completedOrders].length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-bold mb-4">Altri ordini</h2>
          <div className="space-y-3">
            {[...confirmedOrders, ...completedOrders].map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                items={orderItems[order.id] ?? []}
                expanded={expandedOrders.has(order.id)}
                onToggle={() => toggleOrder(order.id)}
                onStatus={updateStatus}
                statusBadge={statusBadge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  items,
  expanded,
  onToggle,
  onStatus,
  statusBadge,
}: {
  order: Order & { delivery_slots?: any };
  items: OrderItem[];
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, status: string, orderData?: any) => void;
  statusBadge: (s: string) => string;
}) {
  const slot = order.delivery_slots as any;
  const slotLabel = slot
    ? `${new Date(slot.delivery_date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })} ${slot.time_start}-${slot.time_end}`
    : null;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3">
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-xs text-muted-foreground">
                {order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("it-IT")}
              </p>
              <p className="text-sm font-medium">{order.pickup_points?.name}</p>
              {slotLabel && <p className="text-xs text-primary">{slotLabel}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {order.co2_kg != null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Leaf className="h-3 w-3" /> {formatCO2(order.co2_kg)}
              </span>
            )}
            <Badge className={statusBadge(order.status)}>
              {order.status.replace("_", " ")}
            </Badge>
            <span className="font-semibold text-sm">
              €{formatPrice(order.total_amount + order.delivery_fee - (order.delivery_discount || 0))}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pl-7 space-y-3">
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-muted-foreground">
                  <span>{item.products?.name} × {item.quantity}</span>
                  <span>€{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span>CO₂</span>
              <span>{order.co2_kg != null ? formatCO2(order.co2_kg) : "—"}</span>
            </div>
            {order.delivery_discount != null && order.delivery_discount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Sconto consegna</span>
                <span>-€{formatPrice(order.delivery_discount)}</span>
              </div>
            )}
            <div className="flex gap-2">
              {order.status === "in_attesa" && (
                <Button size="sm" onClick={() => onStatus(order.id, "confermato", order)}>Conferma</Button>
              )}
              {order.status === "confermato" && (
                <Button size="sm" onClick={() => onStatus(order.id, "in_consegna")}>In consegna</Button>
              )}
              {order.status === "in_consegna" && (
                <Button size="sm" onClick={() => onStatus(order.id, "completato")}>Completato</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
