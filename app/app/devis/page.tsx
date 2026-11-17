"use client";

import { useMemo, useState } from "react";
import { useStore, DEMO_USER } from "@/lib/store";
import type { Quote, QuoteLine, QuoteStatus } from "@/lib/types";
import {
  Badge, Button, Card, EmptyState, Field, Icon, Input, Modal, PageHeader, Select,
} from "@/components/ui";
import { QUOTE_STATUS } from "@/lib/labels";
import { formatDate, formatEur, formatEurCents, quoteTotals, uid } from "@/lib/format";

const newLine = (): QuoteLine => ({ id: uid(), designation: "", quantite: 1, prixUnitaire: 0, tva: 20 });

export default function DevisPage() {
  const { data, upsertQuote, deleteQuote, contactById } = useStore();
  const [status, setStatus] = useState<"" | QuoteStatus>("");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);

  const nextNumero = () => {
    const year = new Date().getFullYear();
    const nums = data.quotes
      .map((q) => q.numero.match(/D-(\d{4})-(\d+)/))
      .filter((m): m is RegExpMatchArray => !!m && Number(m[1]) === year)
      .map((m) => Number(m[2]));
    return `D-${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const list = useMemo(
    () =>
      data.quotes
        .filter((q) => !status || q.statut === status)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.quotes, status],
  );

  const totals = useMemo(() => {
    const by = (s: QuoteStatus) => data.quotes.filter((q) => q.statut === s).reduce((a, q) => a + quoteTotals(q).ht, 0);
    return { envoye: by("envoye"), accepte: by("accepte") };
  }, [data.quotes]);

  const create = () =>
    setEditing({
      id: uid(), numero: nextNumero(), contactId: data.contacts[0]?.id ?? "",
      date: new Date().toISOString(), validiteJours: 30, statut: "brouillon", lignes: [newLine()],
    });

  return (
    <>
      <PageHeader
        title="Devis"
        subtitle={`${formatEur(totals.envoye)} en attente de réponse · ${formatEur(totals.accepte)} acceptés (HT)`}
        actions={
          <Button onClick={create} disabled={!data.contacts.length}>
            <Icon name="plus" className="h-4 w-4" /> Nouveau devis
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          {([["", "Tous"], ...Object.entries(QUOTE_STATUS).map(([k, v]) => [k, v.label])] as [string, string][]).map(
            ([k, label]) => (
              <button
                key={k}
                onClick={() => setStatus(k as "" | QuoteStatus)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  status === k ? "bg-brand-600 text-white" : "text-muted ring-1 ring-line hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {list.length === 0 ? (
          <EmptyState title="Aucun devis" text="Créez votre premier devis en quelques clics." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((q) => {
              const c = contactById(q.contactId);
              const t = quoteTotals(q);
              return (
                <li key={q.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{q.numero}</p>
                      <Badge className={QUOTE_STATUS[q.statut].cls}>{QUOTE_STATUS[q.statut].label}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {c ? `${c.entreprise} · ${c.prenom} ${c.nom}` : "Contact supprimé"} · {formatDate(q.date)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="font-semibold">{formatEurCents(t.ht)} HT</p>
                      <p className="text-xs text-muted">{formatEurCents(t.ttc)} TTC</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreview(q)} title="Aperçu / imprimer">
                        <Icon name="printer" className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(q)} title="Modifier">
                        <Icon name="edit" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <QuoteForm
          initial={editing}
          isNew={!data.quotes.some((q) => q.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(q) => {
            upsertQuote(q);
            setEditing(null);
          }}
          onDelete={() => {
            if (confirm("Supprimer ce devis ?")) {
              deleteQuote(editing.id);
              setEditing(null);
            }
          }}
        />
      )}

      {preview && <QuotePreview quote={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function QuoteForm({
  initial, isNew, onClose, onSave, onDelete,
}: {
  initial: Quote; isNew: boolean; onClose: () => void; onSave: (q: Quote) => void; onDelete: () => void;
}) {
  const { data } = useStore();
  const [q, setQ] = useState(initial);
  const t = quoteTotals(q);

  const setLine = (id: string, patch: Partial<QuoteLine>) =>
    setQ((p) => ({ ...p, lignes: p.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={isNew ? `Nouveau devis ${q.numero}` : `Devis ${q.numero}`}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" className="mr-auto" onClick={onDelete}>
              <Icon name="trash" className="h-4 w-4" /> Supprimer
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button form="quote-form" type="submit">Enregistrer</Button>
        </>
      }
    >
      <form
        id="quote-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...q, lignes: q.lignes.filter((l) => l.designation.trim()) });
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Client" className="sm:col-span-3">
            <Select value={q.contactId} onChange={(e) => setQ({ ...q, contactId: e.target.value })}>
              {data.contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.entreprise} — {c.prenom} {c.nom}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={q.date.slice(0, 10)}
              onChange={(e) => e.target.value && setQ({ ...q, date: new Date(e.target.value + "T10:00:00").toISOString() })}
            />
          </Field>
          <Field label="Validité (jours)">
            <Input type="number" min={1} value={q.validiteJours} onChange={(e) => setQ({ ...q, validiteJours: Number(e.target.value) })} />
          </Field>
          <Field label="Statut">
            <Select value={q.statut} onChange={(e) => setQ({ ...q, statut: e.target.value as QuoteStatus })}>
              {Object.entries(QUOTE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold">Lignes du devis</p>
        <div className="space-y-3">
          <div className="hidden grid-cols-[1fr_70px_110px_80px_100px_32px] gap-2 px-1 text-xs font-medium text-muted sm:grid">
            <span>Désignation</span><span>Qté</span><span>Prix unit. HT</span><span>TVA %</span><span className="text-right">Total HT</span><span />
          </div>
          {q.lignes.map((l) => (
            <div key={l.id} className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-line sm:grid-cols-[1fr_70px_110px_80px_100px_32px] sm:items-center sm:bg-transparent sm:p-0 sm:ring-0">
              <Input
                className="col-span-2 sm:col-span-1"
                placeholder="Désignation"
                value={l.designation}
                onChange={(e) => setLine(l.id, { designation: e.target.value })}
              />
              <Input type="number" min={0} step="any" aria-label="Quantité" value={l.quantite} onChange={(e) => setLine(l.id, { quantite: Number(e.target.value) })} />
              <Input type="number" min={0} step="any" aria-label="Prix unitaire HT" value={l.prixUnitaire} onChange={(e) => setLine(l.id, { prixUnitaire: Number(e.target.value) })} />
              <Select aria-label="TVA" value={l.tva} onChange={(e) => setLine(l.id, { tva: Number(e.target.value) })}>
                {[20, 10, 5.5, 0].map((v) => <option key={v} value={v}>{v} %</option>)}
              </Select>
              <span className="self-center text-right text-sm font-medium">{formatEurCents(l.quantite * l.prixUnitaire)}</span>
              <button
                type="button"
                onClick={() => setQ({ ...q, lignes: q.lignes.filter((x) => x.id !== l.id) })}
                className="col-span-2 justify-self-end rounded-md p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 sm:col-span-1"
                aria-label="Supprimer la ligne"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={() => setQ({ ...q, lignes: [...q.lignes, newLine()] })}>
            <Icon name="plus" className="h-4 w-4" /> Ajouter une ligne
          </Button>
        </div>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Total HT</span><span>{formatEurCents(t.ht)}</span></div>
          <div className="flex justify-between"><span className="text-muted">TVA</span><span>{formatEurCents(t.tva)}</span></div>
          <div className="flex justify-between border-t border-line pt-1.5 text-base font-semibold"><span>Total TTC</span><span>{formatEurCents(t.ttc)}</span></div>
        </div>
      </form>
    </Modal>
  );
}

function QuotePreview({ quote: q, onClose }: { quote: Quote; onClose: () => void }) {
  const { contactById } = useStore();
  const c = contactById(q.contactId);
  const t = quoteTotals(q);
  const until = new Date(q.date);
  until.setDate(until.getDate() + q.validiteJours);

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Aperçu — ${q.numero}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button onClick={() => window.print()}>
            <Icon name="printer" className="h-4 w-4" /> Imprimer / PDF
          </Button>
        </>
      }
    >
      <div className="print-area bg-white text-sm">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-lg font-semibold text-brand-700">Atelier Démo SARL</p>
            <p className="text-muted">12 rue de l&apos;Exemple<br />26200 Montélimar<br />SIRET 000 000 000 00000</p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold tracking-tight">DEVIS</p>
            <p className="text-muted">N° {q.numero}<br />Date : {formatDate(q.date)}<br />Valable jusqu&apos;au {formatDate(until.toISOString())}</p>
          </div>
        </div>

        {c && (
          <div className="mt-6 ml-auto w-full max-w-xs rounded-lg bg-slate-50 p-4 ring-1 ring-line">
            <p className="text-xs uppercase tracking-wide text-muted">Client</p>
            <p className="mt-1 font-medium">{c.entreprise}</p>
            <p className="text-muted">{c.prenom} {c.nom}<br />{c.ville}<br />{c.email}</p>
          </div>
        )}

        <table className="mt-6 w-full">
          <thead>
            <tr className="border-b-2 border-ink text-left text-xs uppercase tracking-wide">
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">P.U. HT</th>
              <th className="hidden py-2 text-right sm:table-cell">TVA</th>
              <th className="py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {q.lignes.map((l) => (
              <tr key={l.id}>
                <td className="py-2 pr-2">{l.designation}</td>
                <td className="py-2 text-right">{l.quantite}</td>
                <td className="py-2 text-right">{formatEurCents(l.prixUnitaire)}</td>
                <td className="hidden py-2 text-right sm:table-cell">{l.tva} %</td>
                <td className="py-2 text-right">{formatEurCents(l.quantite * l.prixUnitaire)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1">
          <div className="flex justify-between"><span>Total HT</span><span>{formatEurCents(t.ht)}</span></div>
          <div className="flex justify-between"><span>TVA</span><span>{formatEurCents(t.tva)}</span></div>
          <div className="flex justify-between border-t-2 border-ink pt-1 text-base font-semibold"><span>Total TTC</span><span>{formatEurCents(t.ttc)}</span></div>
        </div>

        <p className="mt-8 text-xs text-muted">
          Bon pour accord — date et signature du client précédées de la mention « Lu et approuvé ».
          <br />
          Devis établi par {DEMO_USER.name}. Document de démonstration, sans valeur commerciale.
        </p>
      </div>
    </Modal>
  );
}
