/**
 * KM Zero — Slot Generator
 *
 * Genera automaticamente slot di consegna settimanali per ogni punto ritiro attivo.
 * Chiamabile da API admin o scheduled job.
 */

import { createClient } from "@/lib/supabase/server";

const DELIVERY_DAYS = [1, 3, 5]; // lunedì, mercoledì, venerdì
const TIME_SLOTS = [
  { start: "08:00", end: "10:00" },
  { start: "10:00", end: "12:00" },
  { start: "14:00", end: "16:00" },
  { start: "16:00", end: "18:00" },
];
const MAX_ORDERS_PER_SLOT = 15;

export async function generateWeeklySlots() {
  const supabase = await createClient();

  // Prendi tutti i punti ritiro attivi
  const { data: points } = await supabase
    .from("pickup_points")
    .select("id")
    .eq("is_active", true);

  if (!points || points.length === 0) return { created: 0 };

  const today = new Date();
  let created = 0;

  // Genera slot per le prossime 2 settimane
  for (let week = 0; week < 2; week++) {
    for (const dayOffset of DELIVERY_DAYS) {
      // Trova il prossimo giorno della settimana
      const currentDay = today.getDay(); // 0 = domenica, 1 = lunedì...
      let daysUntil = dayOffset - currentDay + week * 7;
      if (daysUntil <= 0) daysUntil += 7;

      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + daysUntil);
      const dateStr = deliveryDate.toISOString().split("T")[0];

      for (const point of points) {
        for (const slot of TIME_SLOTS) {
          const { error } = await supabase.from("delivery_slots").insert({
            pickup_point_id: point.id,
            delivery_date: dateStr,
            time_start: slot.start,
            time_end: slot.end,
            max_orders: MAX_ORDERS_PER_SLOT,
            current_orders: 0,
            is_active: true,
          });

          if (!error) created++;
          // Ignora errori di unique constraint (slot già esistenti)
        }
      }
    }
  }

  return { created };
}

/**
 * Per un produttore, calcola la prima data disponibile in base ai giorni di preparazione.
 */
export function calculateAvailableDate(prepDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + prepDays);
  // Salta la domenica
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}
