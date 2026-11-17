"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Avatar, Card, Icon, PageHeader, cx } from "@/components/ui";
import { formatDateShort, formatEur, initials, quoteTotals, todayKey } from "@/lib/format";
import { NOTE_TYPES, STAGES } from "@/lib/labels";

export default function Dashboard() {
  const { data, contactById, upsertTask } = useStore();
  const today = todayKey();

  const stats = useMemo(() => {
    const won = data.deals.filter((d) => d.etape === "gagne");
    const lost = data.deals.filter((d) => d.etape === "perdu");
    const open = data.deals.filter((d) => d.etape !== "gagne" && d.etape !== "perdu");
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const wonYear = won.filter((d) => d.dateCloture >= yearStart);
    const pending = data.quotes.filter((q) => q.statut === "envoye");
    return {
      caSigne: wonYear.reduce((s, d) => s + d.montant, 0),
      pipeline: open.reduce((s, d) => s + d.montant, 0),
      openCount: open.length,
      conversion: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
      pendingCount: pending.length,
      pendingTotal: pending.reduce((s, q) => s + quoteTotals(q).ht, 0),
    };
  }, [data]);

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = data.deals
        .filter((x) => x.etape === "gagne")
        .filter((x) => {
          const c = new Date(x.dateCloture);
          return c >= d && c < next;
        })
        .reduce((s, x) => s + x.montant, 0);
      return { label: d.toLocaleDateString("fr-FR", { month: "short" }), total };
    });
  }, [data.deals]);
  const maxMonth = Math.max(1, ...monthly.map((m) => m.total));

  const byStage = STAGES.filter((s) => s.id !== "perdu").map((s) => {
    const deals = data.deals.filter((d) => d.etape === s.id);
    return { ...s, count: deals.length, total: deals.reduce((a, d) => a + d.montant, 0) };
  });
  const maxStage = Math.max(1, ...byStage.map((s) => s.total));

  const dueTasks = data.tasks
    .filter((t) => !t.faite && t.echeance <= today)
    .sort((a, b) => a.echeance.localeCompare(b.echeance));

  const recentNotes = data.contacts
    .flatMap((c) => c.notes.map((n) => ({ ...n, contact: c })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Bonjour Alex 👋"
        subtitle={new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="euro" label="CA signé cette année" value={formatEur(stats.caSigne)} hint="Opportunités gagnées" />
        <Kpi icon="trend" label="Pipeline en cours" value={formatEur(stats.pipeline)} hint={`${stats.openCount} opportunités ouvertes`} />
        <Kpi icon="target" label="Taux de conversion" value={`${stats.conversion} %`} hint="Gagnées / (gagnées + perdues)" />
        <Kpi icon="file" label="Devis en attente" value={formatEur(stats.pendingTotal)} hint={`${stats.pendingCount} devis envoyés (HT)`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Chiffre d&apos;affaires signé</h2>
            <span className="text-xs text-muted">6 derniers mois</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3 sm:gap-6">
            {monthly.map((m, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium text-muted">{m.total ? formatEur(m.total) : "—"}</span>
                <div
                  className={cx(
                    "w-full max-w-14 rounded-t-md transition-all",
                    i === monthly.length - 1 ? "bg-brand-600" : "bg-brand-200",
                  )}
                  style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }}
                />
                <span className="text-xs capitalize text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pipeline par étape</h2>
            <Link href="/app/pipeline" className="text-xs font-medium text-brand-600 hover:underline">
              Voir
            </Link>
          </div>
          <ul className="mt-5 space-y-4">
            {byStage.map((s) => (
              <li key={s.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cx("h-2 w-2 rounded-full", s.color)} />
                    {s.label}
                    <span className="text-muted">({s.count})</span>
                  </span>
                  <span className="font-medium">{formatEur(s.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cx("h-full rounded-full", s.color)} style={{ width: `${(s.total / maxStage) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Relances du jour et en retard</h2>
            <Link href="/app/relances" className="text-xs font-medium text-brand-600 hover:underline">
              Tout voir
            </Link>
          </div>
          {dueTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Rien à relancer aujourd&apos;hui. 🎉</p>
          ) : (
            <ul className="divide-y divide-line">
              {dueTasks.map((t) => {
                const c = contactById(t.contactId);
                const late = t.echeance < today;
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <button
                      onClick={() => upsertTask({ ...t, faite: true })}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-slate-300 hover:bg-emerald-50 hover:ring-emerald-400"
                      aria-label="Marquer comme faite"
                      title="Marquer comme faite"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.titre}</p>
                      {c && <p className="truncate text-xs text-muted">{c.prenom} {c.nom} · {c.entreprise}</p>}
                    </div>
                    <span className={cx("text-xs font-medium", late ? "text-rose-600" : "text-amber-600")}>
                      {late ? "En retard" : "Aujourd'hui"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Derniers échanges</h2>
          </div>
          <ul className="divide-y divide-line">
            {recentNotes.map((n) => (
              <li key={n.id} className="flex gap-3 px-5 py-3">
                <Avatar text={initials(n.contact.prenom, n.contact.nom)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link href={`/app/contacts?id=${n.contact.id}`} className="font-medium hover:underline">
                      {n.contact.prenom} {n.contact.nom}
                    </Link>{" "}
                    <span className="text-muted">· {NOTE_TYPES[n.type]} · {formatDateShort(n.date)}</span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.texte}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Kpi({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="rounded-md bg-brand-50 p-1.5 text-brand-600">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}
