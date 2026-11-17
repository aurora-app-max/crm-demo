import type {
  ContactStatus,
  DealStage,
  NoteType,
  QuoteStatus,
  TaskType,
} from "./types";

export const CONTACT_STATUS: Record<ContactStatus, { label: string; cls: string }> = {
  prospect: { label: "Prospect", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  client: { label: "Client", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  inactif: { label: "Inactif", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "nouveau", label: "Nouveau", color: "bg-slate-400" },
  { id: "contacte", label: "Contacté", color: "bg-sky-500" },
  { id: "proposition", label: "Proposition", color: "bg-indigo-500" },
  { id: "negociation", label: "Négociation", color: "bg-amber-500" },
  { id: "gagne", label: "Gagné", color: "bg-emerald-500" },
  { id: "perdu", label: "Perdu", color: "bg-rose-500" },
];

export const stageLabel = (s: DealStage) =>
  STAGES.find((x) => x.id === s)?.label ?? s;

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; cls: string }> = {
  brouillon: { label: "Brouillon", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  envoye: { label: "Envoyé", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  accepte: { label: "Accepté", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  refuse: { label: "Refusé", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const NOTE_TYPES: Record<NoteType, string> = {
  appel: "Appel",
  email: "Email",
  rdv: "Rendez-vous",
  note: "Note",
};

export const TASK_TYPES: Record<TaskType, string> = {
  appel: "Appel",
  email: "Email",
  rdv: "Rendez-vous",
  autre: "Autre",
};

export const SOURCES = [
  "Site web",
  "Recommandation",
  "Salon",
  "LinkedIn",
  "Appel entrant",
  "Prospection",
];
