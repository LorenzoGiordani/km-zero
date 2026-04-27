"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<"cliente" | "produttore">("cliente");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            role,
          });
        }
        toast.success("Registrazione completata. Verifica la tua email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bentornato!");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center font-serif text-3xl">
        {isRegister ? "Registrati" : "Accedi"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {isRegister && (
          <div>
            <Label>Ruolo</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === "cliente"} onChange={() => setRole("cliente")} />
                Cliente
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === "produttore"} onChange={() => setRole("produttore")} />
                Produttore
              </label>
            </div>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Caricamento..." : isRegister ? "Registrati" : "Accedi"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">
        {isRegister ? "Hai già un account?" : "Non hai un account?"}{" "}
        <button onClick={() => setIsRegister(!isRegister)} className="text-green-700 underline">
          {isRegister ? "Accedi" : "Registrati"}
        </button>
      </p>
    </div>
  );
}
