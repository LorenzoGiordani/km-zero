"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product, Category, PickupPoint, CartItem } from "@/lib/types";
import { formatPrice, haversineDistance } from "@/lib/utils";
import { ShoppingBasket, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("categories").select("*").order("display_order").then(({ data }) => setCategories(data ?? []));
    supabase.from("pickup_points").select("*").eq("is_active", true).then(({ data }) => setPickupPoints(data ?? []));
    supabase.from("products").select("*, profiles(full_name, company_name), categories(name)").eq("is_active", true).then(({ data }) => {
      setProducts(data ?? []);
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
    const lat = 44.8;
    const lng = 10.3;
    return haversineDistance(pickup.lat, pickup.lng, lat, lng);
  };

  if (loading) return <div className="py-20 text-center text-stone-500">Caricamento...</div>;

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
      </section>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
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
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
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

      {filtered.length === 0 && (
        <p className="py-12 text-center text-stone-500">Nessun prodotto disponibile.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => {
          const dist = distanceKm(product);
          return (
            <Card key={product.id} className="overflow-hidden border-border">
              <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm">Foto prodotto</span>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{product.categories?.name}</Badge>
                  {dist !== null && (
                    <span className="text-xs text-muted-foreground">{dist.toFixed(1)} km</span>
                  )}
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
