"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { Task, TaskType } from "@/lib/types";
import { Button, Card, EmptyState, Field, Icon, Input, Modal, PageHeader, Select, cx } from "@/components/ui";
import { TASK_TYPES } from "@/lib/labels";
import { formatDate, todayKey, uid } from "@/lib/format";

type Group = "retard" | "aujourdhui" | "avenir" | "faites";

const GROUPS: { id: Group; label: string }[] = [
  { id: "retard", label: "En retard" },
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "avenir", label: "À venir" },
  { id: "faites", label: "Terminées" },
];

const TYPE_ICON: Record<TaskType, string> = { appel: "phone", email: "mail", rdv: "calendar", autre: "check" };

export default function RelancesPage() {
  const { data, upsertTask, deleteTask, contactById } = useStore();
  const today = todayKey();
  const [editing, setEditing] = useState<Task | null>(null);

  const groupOf = (t: Task): Group =>
    t.faite ? "faites" : t.echeance < today ? "retard" : t.echeance === today ? "aujourdhui" : "avenir";

  const counts = Object.fromEntries(
    GROUPS.map((g) => [g.id, data.tasks.filter((t) => groupOf(t) === g.id).length]),
  ) as Record<Group, number>;

  const [tab, setTab] = useState<Group>(counts.retard ? "retard" : "aujourdhui");

  const list = data.tasks
    .filter((t) => groupOf(t) === tab)
    .sort((a, b) => (tab === "faites" ? b.echeance.localeCompare(a.echeance) : a.echeance.localeCompare(b.echeance)));

  return (
    <>
      <PageHeader
        title="Relances"
        subtitle="Ne laissez plus passer un rappel : appels, emails et rendez-vous à faire."
        actions={
          <Button
            onClick={() =>
              setEditing({ id: uid(), titre: "", contactId: data.contacts[0]?.id ?? null, echeance: today, type: "appel", faite: false })
            }
          >
            <Icon name="plus" className="h-4 w-4" /> Nouvelle relance
          </Button>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className={cx(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
              tab === g.id ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            {g.label}
            <span
              className={cx(
                "rounded-full px-1.5 text-xs",
                g.id === "retard" && counts.retard ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-muted",
              )}
            >
              {counts[g.id]}
            </span>
          </button>
        ))}
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState title="Rien ici" text="Aucune relance dans cette catégorie." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((t) => {
              const c = contactById(t.contactId);
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <button
                    onClick={() => upsertTask({ ...t, faite: !t.faite })}
                    className={cx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1",
                      t.faite ? "bg-emerald-500 text-white ring-emerald-500" : "ring-slate-300 hover:ring-emerald-400",
                    )}
                    aria-label={t.faite ? "Marquer à faire" : "Marquer comme faite"}
                  >
                    {t.faite && <Icon name="check" className="h-3.5 w-3.5" />}
                  </button>
                  <span className="hidden rounded-md bg-brand-50 p-1.5 text-brand-600 sm:block">
                    <Icon name={TYPE_ICON[t.type]} className="h-4 w-4" />
                  </span>
                  <button onClick={() => setEditing(t)} className="min-w-0 flex-1 text-left">
                    <p className={cx("truncate text-sm font-medium", t.faite && "text-muted line-through")}>{t.titre}</p>
                    <p className="truncate text-xs text-muted">
                      {TASK_TYPES[t.type]}
                      {c && (
                        <>
                          {" · "}
                          <Link href={`/app/contacts?id=${c.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                            {c.prenom} {c.nom} ({c.entreprise})
                          </Link>
                        </>
                      )}
                    </p>
                  </button>
                  <span className={cx("shrink-0 text-xs font-medium", tab === "retard" ? "text-rose-600" : "text-muted")}>
                    {formatDate(t.echeance + "T10:00:00")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <TaskForm
          initial={editing}
          isNew={!data.tasks.some((t) => t.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            upsertTask(t);
            setEditing(null);
          }}
          onDelete={() => {
            deleteTask(editing.id);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function TaskForm({
  initial, isNew, onClose, onSave, onDelete,
}: {
  initial: Task; isNew: boolean; onClose: () => void; onSave: (t: Task) => void; onDelete: () => void;
}) {
  const { data } = useStore();
  const [t, setT] = useState(initial);

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Nouvelle relance" : "Relance"}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" className="mr-auto" onClick={onDelete}>
              <Icon name="trash" className="h-4 w-4" /> Supprimer
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button form="task-form" type="submit">Enregistrer</Button>
        </>
      }
    >
      <form
        id="task-form"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(t);
        }}
      >
        <Field label="Intitulé" className="sm:col-span-2">
          <Input value={t.titre} onChange={(e) => setT({ ...t, titre: e.target.value })} placeholder="Ex. Relancer le devis" required />
        </Field>
        <Field label="Contact" className="sm:col-span-2">
          <Select value={t.contactId ?? ""} onChange={(e) => setT({ ...t, contactId: e.target.value || null })}>
            <option value="">— Aucun —</option>
            {data.contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.entreprise}</option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={t.type} onChange={(e) => setT({ ...t, type: e.target.value as TaskType })}>
            {Object.entries(TASK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Échéance">
          <Input type="date" value={t.echeance} onChange={(e) => e.target.value && setT({ ...t, echeance: e.target.value })} required />
        </Field>
      </form>
    </Modal>
  );
}
