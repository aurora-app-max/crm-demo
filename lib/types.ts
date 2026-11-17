export type ContactStatus = "prospect" | "client" | "inactif";

export type NoteType = "appel" | "email" | "rdv" | "note";

export interface Note {
  id: string;
  date: string; // ISO
  type: NoteType;
  texte: string;
}

export interface Contact {
  id: string;
  prenom: string;
  nom: string;
  entreprise: string;
  poste: string;
  email: string;
  telephone: string;
  ville: string;
  statut: ContactStatus;
  source: string;
  createdAt: string; // ISO
  notes: Note[];
}

export type DealStage =
  | "nouveau"
  | "contacte"
  | "proposition"
  | "negociation"
  | "gagne"
  | "perdu";

export interface Deal {
  id: string;
  titre: string;
  contactId: string;
  montant: number; // HT, en euros
  etape: DealStage;
  dateCloture: string; // ISO (prévue ou réelle)
  createdAt: string;
}

export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse";

export interface QuoteLine {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number; // HT
  tva: number; // en %, ex. 20
}

export interface Quote {
  id: string;
  numero: string;
  contactId: string;
  date: string; // ISO
  validiteJours: number;
  statut: QuoteStatus;
  lignes: QuoteLine[];
}

export type TaskType = "appel" | "email" | "rdv" | "autre";

export interface Task {
  id: string;
  titre: string;
  contactId: string | null;
  echeance: string; // ISO (date)
  type: TaskType;
  faite: boolean;
}

export interface CrmData {
  contacts: Contact[];
  deals: Deal[];
  quotes: Quote[];
  tasks: Task[];
}
