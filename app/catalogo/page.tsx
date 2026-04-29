"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product, Category, PickupPoint, CartItem, DeliverySlot } from "@/lib/types";
import { formatPrice, haversineDistance, calculateCO2, formatCO2 } from "@/lib/utils";
import { ShoppingBasket, MapPin, ArrowLeft, Leaf, Truck } from "lucide-react";
import Link from "next/link";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_PICKUP_POINTS, MOCK_DELIVERY_SLOTS } from "@/lib/mock-data";

/* ─── LEAFLET MAP COMPONENT ────────────────────────── */

function PickupMap({ points }: { points: PickupPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || loaded) return;
    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!mapRef.current) return;
      const map = L.map(mapRef.current).setView([44.72, 10.3], 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy;CARTO',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#4A5D23;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      points.forEach((p) => {
        if (p.lat && p.lng) {
          L.marker([p.lat, p.lng], { icon })
            .addTo(map)
            .bindPopup(`<strong>${p.name}</strong><br/>${p.address}`);
        }
      });
      setTimeout(() => map.invalidateSize(), 200);
      setLoaded(true);
    };
    init();
  }, [points]);

  return <div ref={mapRef} className="h-[280px] w-full rounded-xl border border-border bg-muted" />;
}

/* ─── CATALOGO PAGE ────────────────────────────────── */

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("categories").select("*").order("display_order").then(({ data }) => {
      setCategories(data?.length ? data : MOCK_CATEGORIES);
    });
    supabase.from("pickup_points").select("*").eq("is_active", true).then(({ data }) => {
      setPickupPoints(data?.length ? data : MOCK_PICKUP_POINTS);
    });
    supabase.from("products").select("*, profiles(full_name, company_name, lat, lng), categories(name)").eq("is_active", true).then(({ data }) => {
      if (data?.length) {
        setProducts(data);
        setUsingMock(false);
      } else {
        setProducts(MOCK_PRODUCTS);
        setUsingMock(true);
      }
      setLoading(false);
    });

    const saved = localStorage.getItem("km0_cart");
    if (saved) setCart(JSON.parse(saved));
  }, [supabase]);

  useEffect(() => {
    localStorage.setItem("km0_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} aggiunto al carrello`);
  };

  const filtered = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  const pickup = pickupPoints.find((p) => p.id === selectedPickup);

  const distanceKm = (product: Product) => {
    if (!pickup || !pickup.lat || !pickup.lng) return null;
    const prodLat = product.profiles?.lat;
    const prodLng = product.profiles?.lng;
    if (!prodLat || !prodLng) return null;
    return haversineDistance(pickup.lat, pickup.lng, prodLat, prodLng);
  };

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const hasProducts = products.length > 0;

  if (loading) return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto mt-3 h-5 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-8 flex gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="aspect-video animate-pulse bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Torna alla home
      </Link>

      <section className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">
          Catalogo Prodotti
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sfoglia i prodotti disponibili questa settimana. Ordina entro giovedì per il ritiro di sabato.
        </p>
        {usingMock && (
          <p className="mt-2 text-xs text-accent animate-pulse">
            Demo: prodotti dimostrativi. Registrati come produttore per aggiungere i tuoi!
          </p>
        )}
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
        >
          Tutti
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={selectedCategory === c.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(c.id)}
          >
            {c.name}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm transition-colors ${
              showMap ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-primary"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Punti ritiro
          </button>
          <select
            className="rounded-md border border-border bg-white px-2 py-1 text-sm"
            value={selectedPickup ?? ""}
            onChange={(e) => setSelectedPickup(e.target.value || null)}
          >
            <option value="">Scegli punto ritiro</option>
            {pickupPoints.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pickup points map */}
      {showMap && (
        <div className="mb-8">
          <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Punti di ritiro attivi
          </h3>
          <PickupMap points={pickupPoints} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {pickupPoints.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{p.address}</p>
                <p className="text-muted-foreground/70 text-xs mt-0.5">Ritiro lun, mer, ven 9:00-12:00</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart indicator */}
      {itemCount > 0 && (
        <div className="mb-6">
          <Link
            href="/carrello"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <ShoppingBasket className="h-5 w-5" />
            {itemCount} {itemCount === 1 ? "prodotto" : "prodotti"} nel carrello
            <ArrowLeft className="ml-1 h-4 w-4 rotate-180" />
          </Link>
        </div>
      )}

      {hasProducts && filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">Nessun prodotto in questa categoria.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => {
          const dist = distanceKm(product);
          return (
            <Card key={product.id} className="overflow-hidden border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 group">
              <div className="aspect-video bg-muted overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                    Foto prodotto
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{product.categories?.name}</Badge>
                  <div className="flex items-center gap-2">
                    {dist !== null && (
                      <>
                        <span className="text-xs text-muted-foreground">{dist.toFixed(1)} km</span>
                        <span className="text-xs text-accent font-medium">{formatCO2(calculateCO2(dist).co2Kg)} CO₂</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-serif text-xl font-semibold">{product.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.profiles?.company_name || product.profiles?.full_name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    €{formatPrice(product.price_per_kg)} / {product.unit_type}
                  </span>
                  <Button size="sm" onClick={() => addToCart(product)}>
                    <ShoppingBasket className="mr-1 h-4 w-4" />
                    Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
