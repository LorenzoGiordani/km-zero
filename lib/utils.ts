import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatPrice(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateCO2(
  distanceKm: number,
  co2KgPerKm: number = 0.15
): { co2Kg: number; co2Cost: number } {
  const co2Kg = distanceKm * co2KgPerKm;
  const co2Cost = co2Kg * 2.0;
  return { co2Kg, co2Cost };
}

export function calculateDeliveryFee(
  distanceKm: number,
  itemCount: number
): { fee: number; discount: number } {
  const baseFee = 3.0;
  const feePerKm = 0.50;
  const extraKm = Math.max(0, distanceKm - 5);

  let fee = baseFee + extraKm * feePerKm;

  // Sconto multi-prodotto
  let discount = 0;
  if (itemCount >= 5) discount = 20;
  else if (itemCount >= 3) discount = 7;
  else if (itemCount >= 2) discount = 3;

  return { fee: Math.max(0, fee - discount), discount };
}

export function formatCO2(co2Kg: number): string {
  if (co2Kg >= 1) return `${co2Kg.toFixed(1)} kg`;
  return `${(co2Kg * 1000).toFixed(0)} g`;
}
