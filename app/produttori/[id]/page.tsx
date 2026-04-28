import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, haversineDistance } from "@/lib/utils";
import { MapPin, Leaf, ShoppingBasket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProducer(id: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "produttore")
    .single();

  if (!profile) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("producer_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { profile, products: products ?? [] };
}

export default async function ProducerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProducer(id);

  if (!data) notFound();

  const { profile, products } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Torna al catalogo
      </Link>

      {/* Producer header */}
      <Card className="border-border mb-8">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-serif font-bold">
              {profile.company_name?.[0] || profile.full_name?.[0] || "?"}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-3xl font-bold">
                {profile.company_name || profile.full_name}
              </h1>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {profile.company_description || "Produttore locale della rete KM Zero. Prodotti freschi, a chilometro zero."}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.lat && profile.lng && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-accent" />
                    Coordinate: {profile.lat.toFixed(4)}, {profile.lng.toFixed(4)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ShoppingBasket className="h-4 w-4 text-primary" />
                  {products.length} prodotti disponibili
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <h2 className="font-serif text-2xl font-bold mb-6">Prodotti di {profile.company_name || profile.full_name}</h2>

      {products.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nessun prodotto disponibile al momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product: any) => (
            <Card key={product.id} className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{product.categories?.name}</Badge>
                    </div>
                    <h3 className="font-serif text-lg font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">
                      €{formatPrice(product.price_per_kg)}
                    </span>
                    <span className="text-sm text-muted-foreground"> / {product.unit_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {product.quantity_available} {product.unit_type} disponibili
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
