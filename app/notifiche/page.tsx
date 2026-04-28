"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Package, Info } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  order_id: string | null;
  created_at: string;
}

const icons: Record<string, any> = {
  success: CheckCircle2,
  alert: Bell,
  info: Info,
};

const iconColors: Record<string, string> = {
  success: "text-green-600",
  alert: "text-accent",
  info: "text-primary",
};

export default function NotifichePage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data: n }) => setNotifs(n ?? []));
    });
  }, [supabase, router]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold">Notifiche</h1>
        {notifs.some((n) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Segna tutte come lette
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nessuna notifica.</p>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const Icon = icons[n.type] || Bell;
            const iconColor = iconColors[n.type] || "text-muted-foreground";
            return (
              <Card
                key={n.id}
                className={`border-border cursor-pointer transition-colors ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => markRead(n.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{n.title}</h3>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {new Date(n.created_at).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
