"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingBasket,
  MapPin,
  Leaf,
  Truck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

/* ─── MOCK DATA ─────────────────────────────────────────── */

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Verdura", display_order: 1 },
  { id: "cat-2", name: "Frutta", display_order: 2 },
  { id: "cat-3", name: "Formaggio", display_order: 3 },
  { id: "cat-4", name: "Pane", display_order: 4 },
  { id: "cat-5", name: "Olio", display_order: 5 },
  { id: "cat-6", name: "Miele", display_order: 6 },
];

const MOCK_PRODUCERS: Record<string, { name: string; address: string; lat: number; lng: number }> = {
  "prod-1": { name: "Azienda Agricola Bianchi", address: "Strada Farnese 22, Parma", lat: 44.805, lng: 10.315 },
  "prod-2": { name: "Fattoria Del Sole", address: "Via Emilia 45, Reggio Emilia", lat: 44.698, lng: 10.631 },
  "prod-3": { name: "Caseificio La Tradizione", address: "Via Roma 10, Langhirano", lat: 44.613, lng: 10.266 },
  "prod-4": { name: "Forno A Legna I Fratelli", address: "Piazza Duomo 3, Modena", lat: 44.647, lng: 10.925 },
  "prod-5": { name: "Frantoio Toscano Emiliano", address: "Via Colli 17, Salsomaggiore", lat: 44.815, lng: 9.978 },
  "prod-6": { name: "Apicoltura Verde", address: "Via Boschi 8, Berceto", lat: 44.514, lng: 9.992 },
};

const MOCK_PRODUCTS = [
  { id: "p-1", producer_id: "prod-1", category_id: "cat-1", name: "Pomodori San Marzano", description: "Pomodori dolci e carnosi, perfetti per sughi e conserve. Coltivati a terra in pieno campo.", price_per_kg: 3.50, unit_type: "kg", quantity_available: 50 },
  { id: "p-2", producer_id: "prod-1", category_id: "cat-1", name: "Zucchine Genovesi", description: "Zucchine chiare tenere e saporite, raccolte a mano ogni mattina.", price_per_kg: 2.80, unit_type: "kg", quantity_available: 30 },
  { id: "p-3", producer_id: "prod-1", category_id: "cat-1", name: "Melanzane Violette", description: "Melanzane dalla polpa soda e senza semi, ideali per parmigiana e grigliate.", price_per_kg: 3.20, unit_type: "kg", quantity_available: 40 },
  { id: "p-4", producer_id: "prod-2", category_id: "cat-2", name: "Mele Annurche Campane", description: "Mele dalla polpa croccante e profumata, raccolte al giusto punto di maturazione.", price_per_kg: 4.00, unit_type: "kg", quantity_available: 60 },
  { id: "p-5", producer_id: "prod-2", category_id: "cat-2", name: "Pere Abate Fetel", description: "Pere dolcissime dalla forma allungata, perfette da gustare fresche o cotte.", price_per_kg: 4.50, unit_type: "kg", quantity_available: 35 },
  { id: "p-6", producer_id: "prod-2", category_id: "cat-2", name: "Albicocche Piemontesi", description: "Albicocche succose e zuccherine, raccolte a mano. Durata limitata: solo in stagione!", price_per_kg: 6.00, unit_type: "kg", quantity_available: 15 },
  { id: "p-7", producer_id: "prod-3", category_id: "cat-3", name: "Parmigiano Reggiano DOP", description: "Parmigiano Reggiano stagionato 24 mesi. Prodotto con latte crudo dei nostri allevamenti.", price_per_kg: 22.00, unit_type: "kg", quantity_available: 20 },
  { id: "p-8", producer_id: "prod-3", category_id: "cat-3", name: "Ricotta Fresca di Bufala", description: "Ricotta cremosa prodotta artigianalmente, senza conservanti. Da consumare fresca.", price_per_kg: 12.00, unit_type: "kg", quantity_available: 10 },
  { id: "p-9", producer_id: "prod-3", category_id: "cat-3", name: "Burro di Malga", description: "Burro tradizionale da centrifuga, profumato e dal colore paglierino naturale.", price_per_kg: 15.00, unit_type: "kg", quantity_available: 8 },
  { id: "p-10", producer_id: "prod-4", category_id: "cat-4", name: "Pane a Pasta Madre", description: "Pane di grani antichi con lievito madre vivo, crosta croccante e mollica alveolata.", price_per_kg: 5.50, unit_type: "kg", quantity_available: 25 },
  { id: "p-11", producer_id: "prod-4", category_id: "cat-4", name: "Focaccia Ligure", description: "Focaccia alta e morbida con olio extra vergine e rosmarino fresco.", price_per_kg: 6.50, unit_type: "kg", quantity_available: 20 },
  { id: "p-12", producer_id: "prod-4", category_id: "cat-4", name: "Grissini Stirati", description: "Grissini artigianali croccanti, tirati a mano uno ad uno.", price_per_kg: 9.00, unit_type: "kg", quantity_available: 30 },
  { id: "p-13", producer_id: "prod-5", category_id: "cat-5", name: "Olio EVO Monocultivar", description: "Olio extra vergine da olive Leccino, spremuto a freddo entro 6 ore dalla raccolta.", price_per_kg: 16.00, unit_type: "L", quantity_available: 40 },
  { id: "p-14", producer_id: "prod-5", category_id: "cat-5", name: "Olive Taggiasche Sott'olio", description: "Olive piccole e saporite, messe sott'olio con erbe aromatiche del nostro orto.", price_per_kg: 13.00, unit_type: "kg", quantity_available: 15 },
  { id: "p-15", producer_id: "prod-6", category_id: "cat-6", name: "Miele di Acacia", description: "Miele chiaro e delicato, ideale per dolcificare senza coprire i sapori.", price_per_kg: 10.00, unit_type: "kg", quantity_available: 25 },
  { id: "p-16", producer_id: "prod-6", category_id: "cat-6", name: "Miele di Castagno", description: "Miele scuro dal sapore intenso e amarognolo, ricco di proprietà benefiche.", price_per_kg: 11.00, unit_type: "kg", quantity_available: 20 },
  { id: "p-17", producer_id: "prod-2", category_id: "cat-1", name: "Insalata Mista di Campo", description: "Mix di lattughino, rucola, valeriana e songino. Lavata e pronta al consumo.", price_per_kg: 3.00, unit_type: "kg", quantity_available: 40 },
  { id: "p-18", producer_id: "prod-1", category_id: "cat-2", name: "Fragole di Stagione", description: "Fragole dolcissime coltivate a terra con pacciamatura naturale.", price_per_kg: 7.50, unit_type: "kg", quantity_available: 12 },
];

const MOCK_PICKUP_POINTS = [
  { id: "pp-1", name: "Mercato Rionale Centro", address: "Via Garibaldi 15, Parma", lat: 44.8015, lng: 10.328, info: "Aperto lun/mer/ven 9:00-12:00" },
  { id: "pp-2", name: "Parcheggio Centro Sportivo", address: "Via delle Acacie 8, Montechiarugolo", lat: 44.695, lng: 10.415, info: "Parcheggio gratuito, area coperta" },
  { id: "pp-3", name: "Cooperativa Il Noce", address: "Strada della Repubblica 42, Collecchio", lat: 44.752, lng: 10.215, info: "Sede cooperativa, ingresso laterale" },
];

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "cat-1": "/images/generated/vegetables.png",
  "cat-2": "/images/generated/fruit.png",
  "cat-3": "/images/generated/dairy.png",
  "cat-4": "/images/generated/bread.png",
  "cat-5": "/images/generated/oil.png",
  "cat-6": "/images/generated/vegetables.png",
};

/* ─── TYPES ─────────────────────────────────────────────── */

interface DemoCartItem {
  productId: string;
  quantity: number;
}

/* ─── COMPONENTI ────────────────────────────────────────── */

function LeafletMap({ points }: { points: typeof MOCK_PICKUP_POINTS }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapLoaded) return;
    let map: any = null;
    let L: any = null;

    const init = async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!mapRef.current) return;

      map = L.map(mapRef.current).setView([44.72, 10.3], 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy;<a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const greenIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#4A5D23;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      points.forEach((p) => {
        const popup = L.popup({ offset: [0, -24] }).setContent(
          `<div style="font-family:system-ui,sans-serif;font-size:13px;min-width:160px">
            <strong style="color:#4A5D23">${p.name}</strong><br/>
            <span style="color:#666">${p.address}</span><br/>
            <span style="color:#999;font-size:11px">${p.info}</span>
          </div>`
        );
        L.marker([p.lat, p.lng], { icon: greenIcon }).addTo(map).bindPopup(popup);
      });

      setTimeout(() => map.invalidateSize(), 200);
      setMapLoaded(true);
    };

    init();
    return () => { if (map) map.remove(); };
  }, [points]);

  return (
    <div className="relative w-full">
      <div ref={mapRef} className="h-[320px] w-full rounded-xl border border-border bg-muted" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {points.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPoint(p.id)}
            className={`rounded-lg border-2 p-3 text-left text-xs transition-all ${
              selectedPoint === p.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <p className="font-semibold text-foreground text-sm">{p.name}</p>
            <p className="text-muted-foreground mt-0.5">{p.address}</p>
            <p className="text-muted-foreground/70 mt-0.5">{p.info}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function WaitlistForm({ type }: { type: "produttore" | "punto_ritiro" }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: type,
          company_name: name,
          message,
        }),
      });
      if (res.ok) {
        setDone(true);
        toast.success("Grazie! Ti contatteremo presto.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore. Riprova.");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 font-serif text-lg font-semibold">Richiesta inviata!</p>
        <p className="mt-1 text-sm text-muted-foreground">Ti contatteremo a breve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder={type === "produttore" ? "Nome azienda agricola" : "Nome attività / punto ritiro"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm focus-ring"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm focus-ring"
      />
      <textarea
        placeholder={type === "produttore" ? "Che prodotti coltivi? Raccontaci di te..." : "Dove si trova? Orari disponibili?"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm focus-ring resize-none"
      />
      <Button type="submit" disabled={submitting} size="lg" className="w-full font-serif tracking-wide">
        {submitting ? "Invio in corso..." : "Invia richiesta"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

/* ─── PAGE ──────────────────────────────────────────────── */

export default function DemoPage() {
  const [cart, setCart] = useState<DemoCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "pickup" | "done">("cart");

  useEffect(() => {
    const saved = localStorage.getItem("km0_demo_cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("km0_demo_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId, quantity: 1 }];
    });
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    toast.success(`${product?.name ?? "Prodotto"} aggiunto al carrello`);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const filtered = selectedCategory
    ? MOCK_PRODUCTS.filter((p) => p.category_id === selectedCategory)
    : MOCK_PRODUCTS;

  const getProduct = (id: string) => MOCK_PRODUCTS.find((p) => p.id === id);
  const getCategory = (id: string) => MOCK_CATEGORIES.find((c) => c.id === id);
  const getProducer = (id: string) => MOCK_PRODUCERS[id];

  const subtotal = cart.reduce((s, i) => {
    const p = getProduct(i.productId);
    return s + (p ? p.price_per_kg * i.quantity : 0);
  }, 0);

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const selectedPickupPoint = MOCK_PICKUP_POINTS.find((p) => p.id === selectedPickup);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Carrello vuoto");
      return;
    }
    if (!selectedPickup) {
      toast.error("Scegli un punto di ritiro");
      return;
    }
    setCart([]);
    localStorage.removeItem("km0_demo_cart");
    setCheckoutStep("done");
    toast.success("Ordine demo completato! Pagherai alla consegna.");
  };

  const formatPrice = (n: number) => n.toFixed(2);

  /* ─── HERO ──────────────────────────────── */

  return (
    <div className="grain-bg">
      {/* HERO */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img src="/images/generated/hero-landing.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="mb-4 bg-cream/20 text-cream hover:bg-cream/30 border-0">
              Demo interattiva
            </Badge>
            <h1 className="font-serif text-4xl font-bold sm:text-5xl lg:text-6xl">
              Prova KM Zero
            </h1>
            <p className="mt-4 text-cream/80 text-lg">
              Sfoglia il catalogo, aggiungi al carrello e simula un ordine.
              Scopri come funziona la piattaforma per i prodotti a km zero.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#catalogo" className="inline-flex">
                <Button size="lg" className="font-serif tracking-wide bg-cream text-primary hover:bg-cream/90 border-0">
                  Sfoglia catalogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#diventa-produttore" className="inline-flex">
                <Button size="lg" variant="outline" className="font-serif tracking-wide border-cream/30 text-cream hover:bg-cream/10">
                  Diventa produttore
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOGO */}
      <section id="catalogo" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent">Catalogo demo</p>
            <h2 className="mt-2 font-serif text-3xl font-bold">Prodotti disponibili</h2>
          </div>
          {/* Cart badge */}
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setCheckoutStep(selectedPickup ? "pickup" : "cart")}
              className="relative flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <ShoppingBasket className="h-5 w-5" />
              Carrello
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            Tutti
          </Button>
          {MOCK_CATEGORIES.map((c) => (
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

        {/* Product grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i.productId === product.id);
            const producer = getProducer(product.producer_id);
            return (
              <Card
                key={product.id}
                className="overflow-hidden border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={CATEGORY_IMAGE_MAP[product.category_id] ?? "/images/generated/vegetables.png"}
                    alt={product.name}
                    className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">{getCategory(product.category_id)?.name}</Badge>
                    <span className="text-xs text-muted-foreground">{producer?.name}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold">{product.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      €{formatPrice(product.price_per_kg)} / {product.unit_type}
                    </span>
                    <Button size="sm" onClick={() => addToCart(product.id)}>
                      <ShoppingBasket className="mr-1 h-4 w-4" />
                      {inCart ? `Aggiungi (${inCart.quantity})` : "Aggiungi"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CART & CHECKOUT — modal overlay */}
      {checkoutStep !== "done" && (
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-3xl border-2 border-border bg-background p-6 sm:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold">
                {checkoutStep === "cart" ? "Il tuo carrello" : "Scegli il punto di ritiro"}
              </h2>
              {checkoutStep === "cart" ? (
                <Button variant="ghost" size="sm" onClick={() => setCheckoutStep("pickup")} disabled={cart.length === 0}>
                  Vai al ritiro <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setCheckoutStep("cart")}>
                  Torna al carrello
                </Button>
              )}
            </div>

            {checkoutStep === "cart" && (
              <>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <img src="/images/generated/empty-cart.png" alt="" className="h-32 w-32 object-contain opacity-60" />
                    <p className="mt-4 text-muted-foreground">Nessun prodotto nel carrello.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, i) => {
                      const product = getProduct(item.productId);
                      if (!product) return null;
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-xl border border-border p-3 animate-reveal-up"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={CATEGORY_IMAGE_MAP[product.category_id]}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getProducer(product.producer_id)?.name} — €{formatPrice(product.price_per_kg)}/{product.unit_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateQty(product.id, -1)}>-</Button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQty(product.id, 1)}>+</Button>
                            <span className="ml-3 min-w-[4rem] text-right font-semibold text-sm">
                              €{formatPrice(product.price_per_kg * item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between border-t border-border pt-4 text-lg font-bold">
                      <span>Totale</span>
                      <span>€{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutStep === "pickup" && (
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  Scegli dove ritirare la tua spesa. I punti di ritiro sono attivi lunedì, mercoledì e venerdì.
                </p>

                <LeafletMap points={MOCK_PICKUP_POINTS} />

                <div className="mt-8 space-y-3">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Truck className="h-4 w-4" /> Punto di ritiro
                  </label>
                  <select
                    className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm focus-ring"
                    value={selectedPickup ?? ""}
                    onChange={(e) => setSelectedPickup(e.target.value || null)}
                  >
                    <option value="">Scegli punto di ritiro</option>
                    {MOCK_PICKUP_POINTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.address}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPickupPoint && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium">{selectedPickupPoint.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedPickupPoint.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedPickupPoint.info}</p>
                  </div>
                )}

                <div className="mt-4 rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotale prodotti</span>
                    <span>€{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Consegna</span>
                    <span>€3.00 (base) + CO₂ calcolata automaticamente</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Leaf className="h-3 w-3" /> Pagamento</span>
                    <span>Alla consegna (contanti o carta)</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                    <span>Totale stimato</span>
                    <span>€{formatPrice(subtotal + 3)}</span>
                  </div>
                </div>

                <Button className="mt-6 w-full" size="lg" onClick={handleCheckout}>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Simula ordine — paga alla consegna
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {checkoutStep === "done" && (
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-3xl border-2 border-border bg-background p-8 sm:p-12 shadow-lg text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 font-serif text-3xl font-bold">Ordine simulato!</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              In una situazione reale, riceverai una notifica con i dettagli dell'ordine e le istruzioni per il ritiro.
            </p>
            <Button
              size="lg"
              className="mt-8 font-serif tracking-wide"
              onClick={() => {
                setCheckoutStep("cart");
                setSelectedPickup(null);
              }}
            >
              Fai un nuovo ordine
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* DIVENTA PRODUTTORE */}
      <section id="diventa-produttore" className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/images/generated/farmer.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">
                Sei un produttore?
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
                Porta i tuoi prodotti<br />
                sulla piattaforma.
              </h2>
              <ul className="mt-8 space-y-3">
                {[
                  "Zero commissioni: vendi al prezzo che decidi tu",
                  "I clienti ti trovano nella loro zona",
                  "Logistica organizzata da KM Zero",
                  "Pagamento garantito alla consegna",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-cream/80">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-cream/20 bg-cream/5 p-6 sm:p-8 backdrop-blur">
              <h3 className="font-serif text-xl font-semibold mb-4">Iscriviti come produttore</h3>
              <WaitlistForm type="produttore" />
            </div>
          </div>
        </div>
      </section>

      {/* PUNTO RITIRO */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="rounded-3xl border-2 border-border bg-white p-6 sm:p-8 shadow-sm">
              <h3 className="font-serif text-xl font-semibold mb-4">Diventa punto di ritiro</h3>
              <WaitlistForm type="punto_ritiro" />
            </div>
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                Hai uno spazio?
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
                Diventa un punto<br />
                di ritiro.
              </h2>
              <ul className="mt-8 space-y-3">
                {[
                  "Negozi, bar, circoli, parcheggi: ogni spazio è utile",
                  "Nuovi clienti per la tua attività",
                  "Compenso per ogni ordine gestito",
                  "Orari flessibili, decidi tu quando essere disponibile",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground/70">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/images/generated/logo-km0.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-serif text-xl font-bold">KM Zero</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Questa è una demo. Per usare la piattaforma reale,{" "}
            <Link href="/login" className="text-primary underline underline-offset-2">registrati</Link> o{" "}
            <Link href="/" className="text-primary underline underline-offset-2">torna alla home</Link>.
          </p>
        </div>
      </footer>
    </div>
  );
}
