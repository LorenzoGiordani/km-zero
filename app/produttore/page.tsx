"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product, Category } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Pencil, Trash2, Plus, Wallet, Truck, MapPin, Leaf } from "lucide-react";

interface WalletData {
  id: string;
  balance: number;
  type: string;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function ProduttorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price_per_kg: "",
    unit_type: "kg",
    quantity_available: "",
    category_id: "",
  });

  const [profileForm, setProfileForm] = useState({
    lat: "",
    lng: "",
    delivery_preference: "hub_delivery",
    company_name: "",
    company_description: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: p }) => {
        if (p?.role !== "produttore" && p?.role !== "admin") { router.push("/"); return; }
        setProfile(p);
        setProfileForm({
          lat: p?.lat?.toString() || "",
          lng: p?.lng?.toString() || "",
          delivery_preference: p?.delivery_preference || "hub_delivery",
          company_name: p?.company_name || "",
          company_description: p?.company_description || "",
        });
        loadProducts(data.user.id);
        loadWallet(data.user.id);
      });
    });
    supabase.from("categories").select("*").order("display_order").then(({ data: c }) => setCategories(c ?? []));
  }, [supabase, router]);

  const loadProducts = async (userId: string) => {
    const { data } = await supabase.from("products").select("*, categories(name)").eq("producer_id", userId).order("created_at", { ascending: false });
    setProducts(data ?? []);
  };

  const loadWallet = async (userId: string) => {
    const { data: w } = await supabase.from("wallets").select("*").eq("user_id", userId).single();
    if (w) {
      setWallet(w);
      const { data: tx } = await supabase.from("wallet_transactions").select("*").eq("wallet_id", w.id).order("created_at", { ascending: false }).limit(20);
      setTransactions(tx ?? []);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const updates: any = {
      delivery_preference: profileForm.delivery_preference,
      company_name: profileForm.company_name,
      company_description: profileForm.company_description,
    };
    if (profileForm.lat) updates.lat = parseFloat(profileForm.lat);
    if (profileForm.lng) updates.lng = parseFloat(profileForm.lng);
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) toast.error("Errore salvataggio profilo");
    else toast.success("Profilo aggiornato");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      producer_id: user.id,
      category_id: form.category_id || null,
      name: form.name,
      description: form.description || null,
      price_per_kg: parseFloat(form.price_per_kg),
      unit_type: form.unit_type,
      quantity_available: parseFloat(form.quantity_available),
      is_active: true,
    };

    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
      toast.success("Prodotto aggiornato");
    } else {
      await supabase.from("products").insert(payload);
      toast.success("Prodotto aggiunto");
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", price_per_kg: "", unit_type: "kg", quantity_available: "", category_id: "" });
    loadProducts(user.id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    toast.success("Prodotto rimosso dal catalogo");
    loadProducts(user!.id);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price_per_kg: p.price_per_kg.toString(),
      unit_type: p.unit_type,
      quantity_available: p.quantity_available.toString(),
      category_id: p.category_id ?? "",
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", price_per_kg: "", unit_type: "kg", quantity_available: "", category_id: "" });
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Dashboard Produttore</h1>
        <Button onClick={openNew} className="font-serif">
          <Plus className="mr-1 h-4 w-4" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Prodotti attivi</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-accent" />
            <div>
              <p className="text-2xl font-bold">€{formatPrice(wallet?.balance || 0)}</p>
              <p className="text-xs text-muted-foreground">Salvadanaio</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold capitalize">{profileForm.delivery_preference === "hub_delivery" ? "Consegno all'hub" : "Ritiro admin"}</p>
              <p className="text-xs text-muted-foreground">Modalità consegna</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profilo + coordinate */}
      <Card className="mb-6 border-border">
        <CardContent className="p-6">
          <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" /> Profilo e Coordinate
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome azienda / attività</Label>
                <Input value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} placeholder="La tua azienda" />
              </div>
              <div>
                <Label>Descrizione</Label>
                <Input value={profileForm.company_description} onChange={(e) => setProfileForm({ ...profileForm, company_description: e.target.value })} placeholder="Breve descrizione" />
              </div>
            </div>
            <div>
              <Label>Latitudine</Label>
              <Input type="number" step="0.0001" value={profileForm.lat} onChange={(e) => setProfileForm({ ...profileForm, lat: e.target.value })} placeholder="44.8015" />
            </div>
            <div>
              <Label>Longitudine</Label>
              <Input type="number" step="0.0001" value={profileForm.lng} onChange={(e) => setProfileForm({ ...profileForm, lng: e.target.value })} placeholder="10.3280" />
            </div>
            <div>
              <Label>Modalità consegna</Label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                value={profileForm.delivery_preference}
                onChange={(e) => setProfileForm({ ...profileForm, delivery_preference: e.target.value })}
              >
                <option value="hub_delivery">Consegno all'hub (a mio carico)</option>
                <option value="admin_pickup">Ritiro da parte dell'admin (costo trasporto addebitato)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleSaveProfile} variant="outline" className="font-serif">Salva profilo</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salvadanaio */}
      {wallet && (
        <Card className="mb-6 border-accent/30 bg-accent/5">
          <CardContent className="p-6">
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" /> Il mio Salvadanaio
            </h2>
            <p className="text-3xl font-bold text-accent mb-1">€{formatPrice(wallet.balance)}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {wallet.balance >= 0 ? "Saldo a credito" : "Saldo a debito"} — aggiornato in tempo reale
            </p>
            {transactions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between text-sm border-b border-border/50 pb-1">
                    <div>
                      <span className={tx.type === "credit" ? "text-green-700" : "text-red-700"}>
                        {tx.type === "credit" ? "+" : "-"}€{formatPrice(tx.amount)}
                      </span>
                      <span className="ml-2 text-muted-foreground text-xs">{tx.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna transazione. Il saldo si aggiorna con gli ordini completati.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product form */}
      {showForm && (
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome prodotto</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrizione</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Prezzo / {form.unit_type} (€)</Label>
                <Input type="number" step="0.01" required value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} />
              </div>
              <div>
                <Label>Unità (kg, l, pz...)</Label>
                <Input value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })} />
              </div>
              <div>
                <Label>Quantità disponibile</Label>
                <Input type="number" step="0.01" required value={form.quantity_available} onChange={(e) => setForm({ ...form, quantity_available: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <select className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">{editing ? "Aggiorna" : "Aggiungi"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products list */}
      <h2 className="font-serif text-xl font-bold mb-4">I miei prodotti</h2>
      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id} className="border-border">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{p.name}</h3>
                  {p.categories?.name && <Badge variant="secondary" className="text-xs">{p.categories.name}</Badge>}
                  {p.quantity_available <= 0 && <Badge className="text-xs bg-red-100 text-red-800">Esaurito</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  €{formatPrice(p.price_per_kg)} / {p.unit_type} — Disp: {p.quantity_available} {p.unit_type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && <p className="py-8 text-center text-muted-foreground">Nessun prodotto inserito.</p>}
      </div>
    </div>
  );
}

function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
