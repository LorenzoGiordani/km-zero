"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Leaf,
  ArrowRight,
  Truck,
  ShoppingBasket,
  Store,
  MapPin,
  Users,
  Sprout,
  CheckCircle2,
} from "lucide-react";

function useParallax() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handler = () => setOffset(window.scrollY * 0.15);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return offset;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("cliente");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, company_name: name }),
      });
      if (res.ok) {
        setDone(true);
        toast.success("Iscrizione completata! Ti terremo aggiornato.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore durante l'iscrizione");
      }
    } catch {
      toast.error("Errore di connessione. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary animate-reveal-up" />
        <p className="mt-4 font-serif text-xl font-semibold text-primary animate-reveal-up anim-delay-200">
          Grazie per l&apos;interesse!
        </p>
        <p className="mt-2 text-muted-foreground animate-reveal-up anim-delay-300">
          Ti contatteremo presto con le novit&agrave; di KM Zero.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setRole("cliente")}
          className={`flex-1 rounded-xl border-2 px-4 py-3 text-left font-serif transition-all duration-200 ${
            role === "cliente"
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border hover:border-primary/40 text-muted-foreground"
          }`}
        >
          <ShoppingBasket className="inline h-5 w-5 mr-2" />
          Cliente
          <span className="block text-xs mt-1 text-muted-foreground/70 font-sans">
            Voglio acquistare
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRole("produttore")}
          className={`flex-1 rounded-xl border-2 px-4 py-3 text-left font-serif transition-all duration-200 ${
            role === "produttore"
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border hover:border-primary/40 text-muted-foreground"
          }`}
        >
          <Sprout className="inline h-5 w-5 mr-2" />
          Produttore
          <span className="block text-xs mt-1 text-muted-foreground/70 font-sans">
            Voglio vendere
          </span>
        </button>
        <button
          type="button"
          onClick={() => setRole("punto_ritiro")}
          className={`flex-1 rounded-xl border-2 px-4 py-3 text-left font-serif transition-all duration-200 ${
            role === "punto_ritiro"
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border hover:border-primary/40 text-muted-foreground"
          }`}
        >
          <MapPin className="inline h-5 w-5 mr-2" />
          Punto ritiro
          <span className="block text-xs mt-1 text-muted-foreground/70 font-sans">
            Voglio ospitare
          </span>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={role === "cliente" ? "Il tuo nome" : "Nome azienda"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 rounded-xl border-2 border-border bg-white px-4 py-3 font-sans text-sm text-foreground focus-ring placeholder:text-muted-foreground/50 transition-colors"
        />
        <input
          type="email"
          placeholder="La tua email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 rounded-xl border-2 border-border bg-white px-4 py-3 font-sans text-sm text-foreground focus-ring placeholder:text-muted-foreground/50 transition-colors"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting}
        size="lg"
        className="w-full sm:w-auto font-serif tracking-wide"
      >
        {submitting ? (
          "Iscrizione in corso..."
        ) : (
          <>
            Iscriviti alla waitlist
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`reveal-scroll ${visible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const parallaxOffset = useParallax();

  return (
    <div className="grain-bg">
      {/* HERO */}
      <section className="relative overflow-hidden bg-background">
        {/* Decorative blob with parallax */}
        <div
          aria-hidden
          className="absolute -top-64 -right-64 h-[600px] w-[600px] animate-blob rounded-full bg-cream/80 opacity-50"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 h-[400px] w-[400px] animate-blob rounded-full bg-cream/60 opacity-40"
          style={{ animationDelay: "-4s", transform: `translateY(${parallaxOffset * -0.3}px)` }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="animate-reveal-up font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Piattaforma locale — Emilia-Romagna
            </p>
            <h1 className="animate-reveal-up anim-delay-100 mt-6 font-serif text-5xl font-bold leading-[1.08] text-foreground sm:text-7xl lg:text-8xl">
              Il sapore vero,
              <br />
              <span className="text-primary">a pochi passi</span>
              <br />
              da casa.
            </h1>
            <p className="animate-reveal-up anim-delay-200 mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Ordina frutta, verdura, formaggi e molto altro direttamente dai
              produttori della tua zona. Consegna settimanale nei punti di
              ritiro vicino a te.
            </p>
            <div className="animate-reveal-up anim-delay-300 mt-10 flex flex-wrap gap-4">
              <Link href="/catalogo">
                <Button size="lg" className="font-serif tracking-wide text-base">
                  Scopri il catalogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#waitlist">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-serif tracking-wide text-base border-2"
                >
                  Diventa produttore
                </Button>
              </Link>
            </div>

            {/* Mini stats */}
            <div className="animate-reveal-up anim-delay-500 mt-16 flex gap-10 border-t border-border pt-8">
              <div>
                <p className="font-serif text-3xl font-bold text-primary number-accent">
                  0 km
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Distanza massima
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-primary number-accent">
                  100%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pagamento alla consegna
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-primary number-accent">
                  -70%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  CO₂ vs supermercato
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <ScrollReveal>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Come funziona
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl">
              Tre passi per la tua spesa
              <br />
              <span className="text-primary">a chilometro zero.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Store,
                title: "Sfoglia il catalogo",
                desc: "Frutta, verdura, formaggi, miele, carne: scegli tra centinaia di prodotti locali dei produttori vicino a te.",
              },
              {
                step: "02",
                icon: ShoppingBasket,
                title: "Fai la spesa",
                desc: "Aggiungi al carrello quello che vuoi. Pagherai alla consegna, in contanti o con carta.",
              },
              {
                step: "03",
                icon: Truck,
                title: "Ritira vicino a casa",
                desc: "Ogni settimana ritiri la tua spesa nel punto di consegna più comodo. Fresco, locale, sostenibile.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step}>
                <div className="group relative rounded-2xl border-2 border-border bg-background p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                  <span className="font-sans text-5xl font-bold text-cream number-accent">
                    {item.step}
                  </span>
                  <item.icon className="mt-4 h-10 w-10 text-accent" />
                  <h3 className="mt-4 font-serif text-xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOR PRODUCERS */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-blob rounded-full bg-white/5"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">
                Sei un produttore?
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
                Porta i tuoi prodotti
                <br />
                direttamente sulle tavole
                <br />
                della tua comunit&agrave;.
              </h2>
              <ul className="mt-8 space-y-4">
                {[
                  "Nessun intermediario: vendi al prezzo che decidi tu",
                  "Consegna settimanale organizzata, tu porti i prodotti al punto ritiro",
                  "Pagamento garantito alla consegna",
                  "Visibilit\u00e0 nella tua zona, senza costi di marketing",
                  "Tracciabilit\u00e0 CO\u2082: ogni prodotto racconta la sua storia",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-cream/80">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <a href="#waitlist">
                  <Button
                    size="lg"
                    className="font-serif tracking-wide text-base bg-cream text-primary hover:bg-cream/90 border-0"
                  >
                    Inizia a vendere
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="hidden lg:block">
                <div className="relative mx-auto w-full max-w-sm">
                  <div className="aspect-[3/4] rounded-3xl border-2 border-cream/20 bg-cream/5 p-8 backdrop-blur">
                    <div className="h-full flex flex-col justify-between">
                      <div>
                        <div className="h-2 w-16 rounded-full bg-cream/30" />
                        <div className="mt-6 space-y-4">
                          <div className="h-32 rounded-xl bg-cream/10" />
                          <div className="h-4 w-3/4 rounded-full bg-cream/20" />
                          <div className="h-3 w-1/2 rounded-full bg-cream/15" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 w-full rounded-full bg-cream/15" />
                        <div className="h-3 w-2/3 rounded-full bg-cream/15" />
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-6 -right-6 h-24 w-24 animate-blob rounded-2xl bg-ochre/30"
                    style={{ animationDelay: "-6s" }}
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* COMMUNITY TRUST */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <ScrollReveal>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Perch&eacute; KM Zero
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sprout,
                title: "Prodotti freschi",
                desc: "Raccolti e consegnati in 24 ore, non giorni o settimane.",
              },
              {
                icon: MapPin,
                title: "Filiera corta",
                desc: "Dal produttore al consumatore, senza intermediari.",
              },
              {
                icon: Users,
                title: "Comunit\u00e0 locale",
                desc: "Sostieni l&apos;economia e i produttori del tuo territorio.",
              },
              {
                icon: Leaf,
                title: "Sostenibile",
                desc: "Meno trasporto = meno CO\u2082. Fino al 70% in meno.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title}>
                <div className="text-center">
                  <item.icon className="mx-auto h-8 w-8 text-accent" />
                  <h3 className="mt-4 font-serif text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-accent text-center">
                In arrivo nella tua zona
              </p>
              <h2 className="mt-4 text-center font-serif text-4xl font-bold text-foreground sm:text-5xl">
                Unisciti alla
                <br />
                <span className="text-primary">waitlist.</span>
              </h2>
              <p className="mt-4 text-center text-muted-foreground">
                Iscriviti per essere tra i primi ad accedere alla piattaforma.
                Che tu sia cliente, produttore o punto di ritiro, KM Zero sta
                arrivando.
              </p>
            </ScrollReveal>

            <ScrollReveal>
              <div className="mt-12 rounded-2xl border-2 border-border bg-white p-8 shadow-sm">
                <WaitlistForm />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-bold text-foreground">KM Zero</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Piattaforma per prodotti locali a chilometro zero. Dal produttore alla tua tavola, senza intermediari.
              </p>
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold mb-4">Link</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/catalogo" className="hover:text-primary transition-colors">Catalogo</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Accedi</Link></li>
                <li><Link href="/carrello" className="hover:text-primary transition-colors">Carrello</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold mb-4">Contatti</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Emilia-Romagna, Italia</li>
                <li>info@km-zero.it</li>
                <li>Parallelis SRL</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Parallelis — Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Leaf className="h-3 w-3 text-primary" /> KM Zero è un progetto sostenibile</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
