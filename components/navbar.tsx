"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, User, LogOut, Menu, X } from "lucide-react";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => setRole(p?.role ?? "cliente"));
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: p }) => setRole(p?.role ?? "cliente"));
      } else {
        setRole(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const dashboardLink =
    role === "admin"
      ? "/admin"
      : role === "produttore"
      ? "/produttore"
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-green-800">
            KM Zero
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-stone-600 hover:text-green-800">
            Catalogo
          </Link>
          {dashboardLink && (
            <Link href={dashboardLink} className="text-sm font-medium text-stone-600 hover:text-green-800">
              Dashboard
            </Link>
          )}
          <Link href="/carrello" className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-green-800">
            <ShoppingBasket className="h-4 w-4" />
            Carrello
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500">{user.email}</span>
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => router.push("/login")}>
              <User className="mr-1 h-4 w-4" />
              Accedi
            </Button>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200 px-4 py-4 md:hidden space-y-3">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium">Catalogo</Link>
          {dashboardLink && (
            <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="block text-sm font-medium">Dashboard</Link>
          )}
          <Link href="/carrello" onClick={() => setMobileOpen(false)} className="block text-sm font-medium">Carrello</Link>
          {user ? (
            <Button size="sm" variant="ghost" onClick={() => { handleLogout(); setMobileOpen(false); }}>
              Esci
            </Button>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium">Accedi</Link>
          )}
        </div>
      )}
    </header>
  );
}
