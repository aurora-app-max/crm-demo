import type { Quote } from "./types";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCents = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export const formatEur = (n: number) => eur.format(n);
export const formatEurCents = (n: number) => eurCents.format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Date du jour au format AAAA-MM-JJ (heure locale). */
export const todayKey = () => toDateKey(new Date());

export const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const quoteTotals = (q: Pick<Quote, "lignes">) => {
  let ht = 0;
  let tva = 0;
  for (const l of q.lignes) {
    const lineHt = l.quantite * l.prixUnitaire;
    ht += lineHt;
    tva += (lineHt * l.tva) / 100;
  }
  return { ht, tva, ttc: ht + tva };
};

export const initials = (prenom: string, nom: string) =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
