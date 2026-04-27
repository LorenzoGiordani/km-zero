# KM Zero — MVP Platform

Piattaforma marketplace per prodotti locali a km zero. Next.js 14 + Supabase.

## Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase (Auth, DB, Storage)

## Setup
1. `npm install`
2. Copia `.env.local.example` in `.env.local` e inserisci credenziali Supabase
3. Esegui `supabase/schema.sql` sul progetto Supabase
4. `npm run dev`

## Ruoli
- `cliente` — vede catalogo, ordina, carrello
- `produttore` — gestisce propri prodotti
- `admin` — gestisce ordini e stato consegne

## Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Note
- Pagamento alla consegna (no Stripe nel MVP)
- Carrello in localStorage
- Distanza calcolata con Haversine (placeholder lat/lng produttore)
- Consegna settimanale fissa — admin gestisce date manualmente
