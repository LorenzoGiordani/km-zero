"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Leaf } from "lucide-react";

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="rounded-3xl border-2 border-border bg-background p-8 shadow-lg">
          <div className="text-center mb-8">
            <Image
              src="/images/generated/logo-km0.webp"
              alt="KM Zero"
              width={56}
              height={56}
              className="mx-auto rounded-xl"
            />
            <h1 className="mt-4 font-serif text-3xl font-bold">
              {isRegister ? "Unisciti a KM Zero" : "Bentornato"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRegister
                ? "Registrati per ordinare o vendere prodotti locali."
                : "Accedi al tuo account per continuare."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="nome@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {isRegister && (
              <div>
                <Label>Registrati come</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("cliente")}
                    className={`rounded-xl border-2 px-4 py-3 text-sm text-left transition-all ${
                      role === "cliente"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">Cliente</span>
                    <span className="block text-xs text-muted-foreground/70 mt-0.5">Voglio acquistare</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("produttore")}
                    className={`rounded-xl border-2 px-4 py-3 text-sm text-left transition-all ${
                      role === "produttore"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">Produttore</span>
                    <span className="block text-xs text-muted-foreground/70 mt-0.5">Voglio vendere</span>
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full font-serif tracking-wide" size="lg" disabled={loading}>
              {loading ? "Caricamento..." : isRegister ? "Crea account" : "Accedi"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Hai già un account?" : "Non hai un account?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary underline underline-offset-2 font-medium"
            >
              {isRegister ? "Accedi" : "Registrati"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Leaf className="h-3 w-3 text-primary" />
          KM Zero — Piattaforma per prodotti locali
        </p>
      </div>
    </div>
  );
}
