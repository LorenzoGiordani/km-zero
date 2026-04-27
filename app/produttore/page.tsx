"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Product, Category } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function ProduttorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_per_kg: "",
    unit_type: "kg",
    quantity_available: "",
    category_id: "",
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      loadProducts(data.user.id);
    });
    supabase.from("categories").select("*").order("display_order").then(({ data }) => setCategories(data ?? []));
  }, [supabase, router]);

  const loadProducts = (uid: string) => {
    supabase.from("products").select("*").eq("producer_id", uid).order("created_at", { ascending: false }).then(({ data }) => setProducts(data ?? []));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      producer_id: user.id,
      name: form.name,
      description: form.description || null,
      price_per_kg: parseFloat(form.price_per_kg),
      unit_type: form.unit_type,
      quantity_available: parseFloat(form.quantity_available) || 0,
      category_id: form.category_id || null,
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
    if (!confirm("Eliminare prodotto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Prodotto eliminato");
    if (user) loadProducts(user.id);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price_per_kg: String(p.price_per_kg),
      unit_type: p.unit_type,
      quantity_available: String(p.quantity_available),
      category_id: p.category_id ?? "",
    });
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">Dashboard Produttore</h1>
        <Button onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          <Plus className="mr-1 h-4 w-4" />
          Nuovo prodotto
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-stone-200">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome</Label>
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
                <Label>Unità</Label>
                <Input value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })} />
              </div>
              <div>
                <Label>Quantità disponibile</Label>
                <Input type="number" step="0.01" required value={form.quantity_available} onChange={(e) => setForm({ ...form, quantity_available: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <select className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
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

      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id} className="border-stone-200">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-sm text-stone-500">
                  €{formatPrice(p.price_per_kg)} / {p.unit_type} — Disponibile: {p.quantity_available}
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
        {products.length === 0 && <p className="py-8 text-center text-stone-500">Nessun prodotto inserito.</p>}
      </div>
    </div>
  );
}
