/**
 * KM Zero — Route Optimizer
 *
 * Nearest-neighbor greedy per VRP (Vehicle Routing Problem).
 * Due fasi: (1) ritiro merce dai produttori, (2) consegna ai punti ritiro.
 *
 * Hub = punto di partenza/rientro (PRIMO pickup_point attivo, o centroide).
 * L'algoritmo considera i tempi di preparazione (1gg confezionato, 2gg sfuso).
 */

import { haversineDistance } from "@/lib/utils";

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "producer" | "pickup";
  orderCount: number;
  prepDays: number; // giorni preparazione necessari
  availableDate?: string; // data in cui la merce è pronta
}

export interface OptimizedRoute {
  collectionRoute: RouteStop[]; // hub → produttori → hub
  deliveryRoute: RouteStop[];   // hub → punti ritiro → hub
  totalKm: number;
  estimatedDuration: number; // ore
  collectionDate: string;
  deliveryDate: string;
}

const AVG_SPEED_KMH = 30; // velocità media in città
const STOP_TIME_MIN = 10; // minuti per fermata

/** Nearest-neighbor: dati i punti e un punto di partenza, restituisce l'ordine ottimale */
export function nearestNeighbor(
  stops: { id: string; lat: number; lng: number }[],
  start: { lat: number; lng: number }
): string[] {
  const unvisited = [...stops];
  const route: string[] = [];
  let current = start;

  while (unvisited.length > 0) {
    let minDist = Infinity;
    let minIdx = 0;
    unvisited.forEach((p, i) => {
      const d = haversineDistance(current.lat, current.lng, p.lat, p.lng);
      if (d < minDist) {
        minDist = d;
        minIdx = i;
      }
    });
    route.push(unvisited[minIdx].id);
    current = unvisited[minIdx];
    unvisited.splice(minIdx, 1);
  }

  return route;
}

/** Calcola km totali di un percorso */
export function routeDistance(
  stops: { lat: number; lng: number }[],
  start: { lat: number; lng: number },
  end?: { lat: number; lng: number }
): number {
  let total = 0;
  let prev = start;
  for (const stop of stops) {
    total += haversineDistance(prev.lat, prev.lng, stop.lat, stop.lng);
    prev = stop;
  }
  if (end) {
    total += haversineDistance(prev.lat, prev.lng, end.lat, end.lng);
  }
  return total;
}

/** Stima tempo percorrenza in ore */
export function estimatedDuration(
  totalKm: number,
  stopCount: number
): number {
  const driveHours = totalKm / AVG_SPEED_KMH;
  const stopHours = (stopCount * STOP_TIME_MIN) / 60;
  return driveHours + stopHours;
}

/**
 * Ottimizza percorso per una data di consegna.
 * Ritorna: percorso raccolta produttori + percorso consegna.
 */
export function optimizeRoute(stops: RouteStop[], hub: { lat: number; lng: number }): OptimizedRoute {
  const producers = stops.filter((s) => s.type === "producer");
  const pickups = stops.filter((s) => s.type === "pickup");

  // Ordina produttori per nearest-neighbor partendo dall'hub
  const producerOrder = nearestNeighbor(producers, hub);
  const orderedProducers = producerOrder
    .map((id) => producers.find((p) => p.id === id)!)
    .filter(Boolean);

  // Ordina pickup per nearest-neighbor
  const pickupOrder = nearestNeighbor(pickups, hub);
  const orderedPickups = pickupOrder
    .map((id) => pickups.find((p) => p.id === id)!)
    .filter(Boolean);

  const collectionKm = routeDistance(orderedProducers, hub, hub);
  const deliveryKm = routeDistance(orderedPickups, hub, hub);
  const totalKm = collectionKm + deliveryKm;
  const duration = estimatedDuration(totalKm, stops.length);

  const today = new Date();
  const prepDays = Math.max(...stops.map((s) => s.prepDays), 0);
  const collectionDate = new Date(today);
  collectionDate.setDate(collectionDate.getDate() + 1); // ritiro domani
  const deliveryDate = new Date(collectionDate);
  deliveryDate.setDate(deliveryDate.getDate() + prepDays);

  return {
    collectionRoute: orderedProducers,
    deliveryRoute: orderedPickups,
    totalKm,
    estimatedDuration: duration,
    collectionDate: collectionDate.toISOString().split("T")[0],
    deliveryDate: deliveryDate.toISOString().split("T")[0],
  };
}

/** Clustering: raggruppa ordini per pickup point e calcola metriche */
export function clusterByHub(
  orders: { pickup_point_id: string; products: { producer_lat: number; producer_lng: number; unit_type: string }[] }[],
  hubLat: number,
  hubLng: number
) {
  const clusters = new Map<string, { orders: number; totalKm: number; prepDays: number }>();

  for (const order of orders) {
    const ppId = order.pickup_point_id;

    if (!clusters.has(ppId)) {
      clusters.set(ppId, { orders: 0, totalKm: 0, prepDays: 0 });
    }

    const c = clusters.get(ppId)!;
    c.orders++;

    for (const p of order.products) {
      c.totalKm += haversineDistance(hubLat, hubLng, p.producer_lat, p.producer_lng);
      c.prepDays = Math.max(c.prepDays, p.unit_type === "kg" ? 2 : 1);
    }
  }

  return clusters;
}
