"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Contact, ContactStatus, NoteType } from "@/lib/types";
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Icon, Input, Modal, PageHeader, Select, Textarea, cx,
} from "@/components/ui";
import { CONTACT_STATUS, NOTE_TYPES, QUOTE_STATUS, SOURCES, stageLabel } from "@/lib/labels";
import { formatDate, formatEur, initials, quoteTotals, uid } from "@/lib/format";

export default function ContactsPage() {
  return (
    <Suspense>
      <Contacts />
    </Suspense>
  );
}

const emptyContact = (): Contact => ({
  id: uid(), prenom: "", nom: "", entreprise: "", poste: "", email: "", telephone: "",
  ville: "", statut: "prospect", source: SOURCES[0], createdAt: new Date().toISOString(), notes: [],
});

const CSV_COLS: (keyof Contact)[] = ["prenom", "nom", "entreprise", "poste", "email", "telephone", "ville", "statut", "source"];

function Contacts() {
  const { data, upsertContact } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const selected = data.contacts.find((c) => c.id === selectedId);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ContactStatus>("");
  const [editing, setEditing] = useState<Contact | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.contacts
      .filter((c) => !status || c.statut === status)
      .filter((c) =>
        !needle ||
        [c.prenom, c.nom, c.entreprise, c.email, c.ville].join(" ").toLowerCase().includes(needle),
      )
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [data.contacts, q, status]);

  const open = (id: string | null) => router.push(id ? `/app/contacts?id=${id}` : "/app/contacts", { scroll: false });

  const exportCsv = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [CSV_COLS.join(";"), ...data.contacts.map((c) => CSV_COLS.map((k) => esc(String(c[k]))).join(";"))];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importCsv = async (file: File) => {
    const text = (await file.text()).replace(/^﻿/, "");
    const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const sep = head.includes(";") ? ";" : ",";
    const cols = head.split(sep).map((h) => h.replace(/"/g, "").trim().toLowerCase());
    let added = 0;
    for (const line of lines) {
      const cells = line.split(sep).map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
      const c = emptyContact();
      cols.forEach((col, i) => {
        if ((CSV_COLS as string[]).includes(col) && cells[i] !== undefined) {
          (c as unknown as Record<string, string>)[col] = cells[i];
        }
      });
      if (!["prospect", "client", "inactif"].includes(c.statut)) c.statut = "prospect";
      if (c.nom || c.entreprise) {
        upsertContact(c);
        added++;
      }
    }
    alert(`${added} contact(s) importé(s).`);
  };

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${data.contacts.length} contacts · ${data.contacts.filter((c) => c.statut === "client").length} clients`}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" className="h-4 w-4" /> Importer
            </Button>
            <Button variant="secondary" onClick={exportCsv}>
              <Icon name="download" className="h-4 w-4" /> Exporter
            </Button>
            <Button onClick={() => setEditing(emptyContact())}>
              <Icon name="plus" className="h-4 w-4" /> Nouveau contact
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un nom, une entreprise, une ville…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as "" | ContactStatus)} className="sm:w-48">
            <option value="">Tous les statuts</option>
            {Object.entries(CONTACT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </div>

        {list.length === 0 ? (
          <EmptyState title="Aucun contact trouvé" text="Modifiez votre recherche ou ajoutez un nouveau contact." />
        ) : (
          <>
            {/* Tableau (ordinateur) */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Entreprise</th>
                  <th className="px-5 py-3 font-medium">Téléphone</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((c) => (
                  <tr key={c.id} onClick={() => open(c.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar text={initials(c.prenom, c.nom)} />
                        <div>
                          <p className="font-medium">{c.prenom} {c.nom}</p>
                          <p className="text-xs text-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p>{c.entreprise}</p>
                      <p className="text-xs text-muted">{c.poste}</p>
                    </td>
                    <td className="px-5 py-3 text-muted">{c.telephone}</td>
                    <td className="px-5 py-3 text-muted">{c.ville}</td>
                    <td className="px-5 py-3">
                      <Badge className={CONTACT_STATUS[c.statut].cls}>{CONTACT_STATUS[c.statut].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Liste (mobile) */}
            <ul className="divide-y divide-line md:hidden">
              {list.map((c) => (
                <li key={c.id}>
                  <button onClick={() => open(c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <Avatar text={initials(c.prenom, c.nom)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.prenom} {c.nom}</p>
                      <p className="truncate text-xs text-muted">{c.entreprise} · {c.ville}</p>
                    </div>
                    <Badge className={CONTACT_STATUS[c.statut].cls}>{CONTACT_STATUS[c.statut].label}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => open(null)}
          onEdit={() => setEditing(selected)}
        />
      )}

      {editing && (
        <ContactForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            upsertContact(c);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ContactForm({ initial, onClose, onSave }: { initial: Contact; onClose: () => void; onSave: (c: Contact) => void }) {
  const [c, setC] = useState(initial);
  const set = <K extends keyof Contact>(k: K, v: Contact[K]) => setC((p) => ({ ...p, [k]: v }));
  const isNew = !initial.prenom && !initial.nom;

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Nouveau contact" : "Modifier le contact"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button form="contact-form" type="submit">Enregistrer</Button>
        </>
      }
    >
      <form
        id="contact-form"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(c);
        }}
      >
        <Field label="Prénom"><Input value={c.prenom} onChange={(e) => set("prenom", e.target.value)} required /></Field>
        <Field label="Nom"><Input value={c.nom} onChange={(e) => set("nom", e.target.value)} required /></Field>
        <Field label="Entreprise"><Input value={c.entreprise} onChange={(e) => set("entreprise", e.target.value)} /></Field>
        <Field label="Poste"><Input value={c.poste} onChange={(e) => set("poste", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Téléphone"><Input value={c.telephone} onChange={(e) => set("telephone", e.target.value)} /></Field>
        <Field label="Ville"><Input value={c.ville} onChange={(e) => set("ville", e.target.value)} /></Field>
        <Field label="Statut">
          <Select value={c.statut} onChange={(e) => set("statut", e.target.value as ContactStatus)}>
            {Object.entries(CONTACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="Source" className="sm:col-span-2">
          <Select value={c.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function ContactDetail({ contact: c, onClose, onEdit }: { contact: Contact; onClose: () => void; onEdit: () => void }) {
  const { data, upsertContact, deleteContact } = useStore();
  const [noteType, setNoteType] = useState<NoteType>("appel");
  const [noteText, setNoteText] = useState("");

  const deals = data.deals.filter((d) => d.contactId === c.id);
  const quotes = data.quotes.filter((q) => q.contactId === c.id);
  const notes = [...c.notes].sort((a, b) => b.date.localeCompare(a.date));

  const addNote = () => {
    if (!noteText.trim()) return;
    upsertContact({
      ...c,
      notes: [{ id: uid(), date: new Date().toISOString(), type: noteType, texte: noteText.trim() }, ...c.notes],
    });
    setNoteText("");
  };

  return (
    <Modal open onClose={onClose} title={`${c.prenom} ${c.nom}`} wide>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-64 md:shrink-0">
          <div className="flex items-center gap-3">
            <Avatar text={initials(c.prenom, c.nom)} className="h-12 w-12 text-sm" />
            <div>
              <p className="font-semibold">{c.entreprise}</p>
              <p className="text-sm text-muted">{c.poste}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Badge className={CONTACT_STATUS[c.statut].cls}>{CONTACT_STATUS[c.statut].label}</Badge>
            <p className="flex items-center gap-2 text-muted"><Icon name="mail" className="h-4 w-4" /> <a className="hover:underline" href={`mailto:${c.email}`}>{c.email}</a></p>
            <p className="flex items-center gap-2 text-muted"><Icon name="phone" className="h-4 w-4" /> <a className="hover:underline" href={`tel:${c.telephone.replace(/\s/g, "")}`}>{c.telephone}</a></p>
            <p className="text-muted">📍 {c.ville}</p>
            <p className="text-muted">Source : {c.source}</p>
            <p className="text-muted">Créé le {formatDate(c.createdAt)}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}><Icon name="edit" className="h-4 w-4" /> Modifier</Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm("Supprimer ce contact et ses opportunités et devis ?")) {
                  deleteContact(c.id);
                  onClose();
                }
              }}
            >
              <Icon name="trash" className="h-4 w-4" />
            </Button>
          </div>

          {(deals.length > 0 || quotes.length > 0) && (
            <div className="mt-6 space-y-4">
              {deals.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Opportunités</p>
                  <ul className="space-y-1.5 text-sm">
                    {deals.map((d) => (
                      <li key={d.id} className="flex justify-between gap-2">
                        <span className="truncate">{d.titre}</span>
                        <span className="shrink-0 text-muted">{stageLabel(d.etape)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {quotes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Devis</p>
                  <ul className="space-y-1.5 text-sm">
                    {quotes.map((q) => (
                      <li key={q.id} className="flex items-center justify-between gap-2">
                        <span>{q.numero} · {formatEur(quoteTotals(q).ht)}</span>
                        <Badge className={QUOTE_STATUS[q.statut].cls}>{QUOTE_STATUS[q.statut].label}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 md:border-l md:border-line md:pl-6">
          <p className="mb-3 text-sm font-semibold">Historique des échanges</p>
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-line">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(Object.keys(NOTE_TYPES) as NoteType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNoteType(t)}
                  className={cx(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    noteType === t ? "bg-brand-600 text-white" : "bg-white text-muted ring-1 ring-line",
                  )}
                >
                  {NOTE_TYPES[t]}
                </button>
              ))}
            </div>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Résumé de l'échange…"
              rows={2}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={addNote} disabled={!noteText.trim()}>Ajouter</Button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucun échange enregistré.</p>
          ) : (
            <ol className="mt-4 space-y-4 border-l border-line pl-4">
              {notes.map((n) => (
                <li key={n.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                  <p className="text-xs text-muted">{NOTE_TYPES[n.type]} · {formatDate(n.date)}</p>
                  <p className="mt-0.5 text-sm">{n.texte}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  );
}
