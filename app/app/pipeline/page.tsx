"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Deal, DealStage } from "@/lib/types";
import { Button, Field, Icon, Input, Modal, PageHeader, Select, cx } from "@/components/ui";
import { STAGES } from "@/lib/labels";
import { formatDateShort, formatEur, uid } from "@/lib/format";

const newDeal = (contactId: string, etape: DealStage = "nouveau"): Deal => {
  const close = new Date();
  close.setDate(close.getDate() + 30);
  return {
    id: uid(), titre: "", contactId, montant: 0, etape,
    dateCloture: close.toISOString(), createdAt: new Date().toISOString(),
  };
};

export default function PipelinePage() {
  const { data, upsertDeal, deleteDeal, contactById } = useStore();
  const [editing, setEditing] = useState<Deal | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<DealStage | null>(null);

  const openTotal = data.deals
    .filter((d) => d.etape !== "gagne" && d.etape !== "perdu")
    .reduce((s, d) => s + d.montant, 0);

  const move = (id: string, etape: DealStage) => {
    const d = data.deals.find((x) => x.id === id);
    if (!d || d.etape === etape) return;
    upsertDeal({
      ...d,
      etape,
      dateCloture: etape === "gagne" || etape === "perdu" ? new Date().toISOString() : d.dateCloture,
    });
  };

  return (
    <>
      <PageHeader
        title="Pipeline commercial"
        subtitle={`${formatEur(openTotal)} en cours · glissez les cartes d'une colonne à l'autre`}
        actions={
          <Button onClick={() => setEditing(newDeal(data.contacts[0]?.id ?? ""))} disabled={!data.contacts.length}>
            <Icon name="plus" className="h-4 w-4" /> Nouvelle opportunité
          </Button>
        }
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-4">
          {STAGES.map((stage) => {
            const deals = data.deals.filter((d) => d.etape === stage.id);
            const total = deals.reduce((s, d) => s + d.montant, 0);
            return (
              <section
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(stage.id);
                }}
                onDragLeave={() => setOver((o) => (o === stage.id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) move(dragId, stage.id);
                  setDragId(null);
                  setOver(null);
                }}
                className={cx(
                  "flex w-72 flex-col rounded-xl bg-slate-100/80 p-3 transition-colors",
                  over === stage.id && "bg-brand-50 ring-2 ring-brand-200",
                )}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cx("h-2.5 w-2.5 rounded-full", stage.color)} />
                    <h2 className="text-sm font-semibold">{stage.label}</h2>
                    <span className="rounded-full bg-white px-2 text-xs text-muted ring-1 ring-line">{deals.length}</span>
                  </div>
                  <span className="text-xs font-medium text-muted">{formatEur(total)}</span>
                </header>

                <div className="flex min-h-24 flex-1 flex-col gap-2.5">
                  {deals.map((d) => {
                    const c = contactById(d.contactId);
                    return (
                      <article
                        key={d.id}
                        draggable
                        onDragStart={() => setDragId(d.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setEditing(d)}
                        className={cx(
                          "cursor-grab rounded-lg bg-white p-3 ring-1 ring-line shadow-sm transition hover:ring-brand-200 active:cursor-grabbing",
                          dragId === d.id && "opacity-50",
                        )}
                      >
                        <p className="text-sm font-medium leading-snug">{d.titre}</p>
                        {c && <p className="mt-1 truncate text-xs text-muted">{c.entreprise || `${c.prenom} ${c.nom}`}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold">{formatEur(d.montant)}</span>
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Icon name="calendar" className="h-3.5 w-3.5" />
                            {formatDateShort(d.dateCloture)}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                  <button
                    onClick={() => data.contacts[0] && setEditing(newDeal(data.contacts[0].id, stage.id))}
                    className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-muted hover:bg-white hover:text-ink"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" /> Ajouter
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {editing && (
        <DealForm
          initial={editing}
          isNew={!data.deals.some((d) => d.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            upsertDeal(d);
            setEditing(null);
          }}
          onDelete={() => {
            if (confirm("Supprimer cette opportunité ?")) {
              deleteDeal(editing.id);
              setEditing(null);
            }
          }}
        />
      )}
    </>
  );
}

function DealForm({
  initial, isNew, onClose, onSave, onDelete,
}: {
  initial: Deal; isNew: boolean; onClose: () => void; onSave: (d: Deal) => void; onDelete: () => void;
}) {
  const { data } = useStore();
  const [d, setD] = useState(initial);
  const set = <K extends keyof Deal>(k: K, v: Deal[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Nouvelle opportunité" : "Opportunité"}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" className="mr-auto" onClick={onDelete}>
              <Icon name="trash" className="h-4 w-4" /> Supprimer
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button form="deal-form" type="submit">Enregistrer</Button>
        </>
      }
    >
      <form
        id="deal-form"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(d);
        }}
      >
        <Field label="Intitulé" className="sm:col-span-2">
          <Input value={d.titre} onChange={(e) => set("titre", e.target.value)} placeholder="Ex. Outil de suivi des commandes" required />
        </Field>
        <Field label="Contact" className="sm:col-span-2">
          <Select value={d.contactId} onChange={(e) => set("contactId", e.target.value)}>
            {data.contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.entreprise}</option>
            ))}
          </Select>
        </Field>
        <Field label="Montant HT (€)">
          <Input type="number" min={0} step={50} value={d.montant} onChange={(e) => set("montant", Number(e.target.value))} />
        </Field>
        <Field label="Étape">
          <Select value={d.etape} onChange={(e) => set("etape", e.target.value as DealStage)}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Date de clôture prévue" className="sm:col-span-2">
          <Input
            type="date"
            value={d.dateCloture.slice(0, 10)}
            onChange={(e) => e.target.value && set("dateCloture", new Date(e.target.value + "T10:00:00").toISOString())}
          />
        </Field>
      </form>
    </Modal>
  );
}
