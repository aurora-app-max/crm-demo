import type { Contact, CrmData, Deal, Quote, Task } from "./types";
import { toDateKey } from "./format";

/** Données fictives, générées par rapport à la date du jour. */
export function buildSeed(now = new Date()): CrmData {
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  };
  const dateKey = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return toDateKey(d);
  };

  const contacts: Contact[] = [
    {
      id: "c1", prenom: "Camille", nom: "Martin", entreprise: "Boulangerie Martin",
      poste: "Gérante", email: "camille@boulangerie-martin.fr", telephone: "06 12 34 56 78",
      ville: "Valence", statut: "client", source: "Recommandation", createdAt: day(-120),
      notes: [
        { id: "n1", date: day(-3), type: "appel", texte: "Satisfaite du module de commandes. Souhaite ajouter la gestion des allergènes." },
        { id: "n2", date: day(-40), type: "rdv", texte: "Présentation du devis, signé sur place." },
      ],
    },
    {
      id: "c2", prenom: "Thomas", nom: "Bernard", entreprise: "Garage Bernard & Fils",
      poste: "Directeur", email: "t.bernard@garage-bernard.fr", telephone: "06 23 45 67 89",
      ville: "Montélimar", statut: "prospect", source: "Site web", createdAt: day(-12),
      notes: [
        { id: "n3", date: day(-2), type: "email", texte: "Envoi de la proposition pour le suivi des interventions et des pièces." },
      ],
    },
    {
      id: "c3", prenom: "Sophie", nom: "Lefèvre", entreprise: "Agence Horizon Immobilier",
      poste: "Responsable d'agence", email: "sophie@horizon-immo.fr", telephone: "07 34 56 78 90",
      ville: "Avignon", statut: "client", source: "Salon", createdAt: day(-200),
      notes: [
        { id: "n4", date: day(-9), type: "rdv", texte: "Point trimestriel. Demande un export mensuel des mandats." },
      ],
    },
    {
      id: "c4", prenom: "Julien", nom: "Moreau", entreprise: "Moreau Plomberie",
      poste: "Artisan", email: "contact@moreau-plomberie.fr", telephone: "06 45 67 89 01",
      ville: "Pierrelatte", statut: "prospect", source: "Prospection", createdAt: day(-6),
      notes: [
        { id: "n5", date: day(-5), type: "appel", texte: "Gère ses devis sur Excel. Intéressé par un outil devis + planning." },
      ],
    },
    {
      id: "c5", prenom: "Nadia", nom: "Rousseau", entreprise: "Institut Belle Peau",
      poste: "Fondatrice", email: "nadia@bellepeau.fr", telephone: "06 56 78 90 12",
      ville: "Valence", statut: "prospect", source: "LinkedIn", createdAt: day(-20),
      notes: [],
    },
    {
      id: "c6", prenom: "Marc", nom: "Petit", entreprise: "Transports Petit",
      poste: "Gérant", email: "marc.petit@transports-petit.fr", telephone: "06 67 89 01 23",
      ville: "Orange", statut: "client", source: "Appel entrant", createdAt: day(-300),
      notes: [
        { id: "n6", date: day(-30), type: "note", texte: "Contrat de maintenance renouvelé pour 12 mois." },
      ],
    },
    {
      id: "c7", prenom: "Élodie", nom: "Garnier", entreprise: "Cabinet Garnier Conseil",
      poste: "Associée", email: "e.garnier@garnier-conseil.fr", telephone: "07 78 90 12 34",
      ville: "Lyon", statut: "prospect", source: "Recommandation", createdAt: day(-15),
      notes: [
        { id: "n7", date: day(-1), type: "rdv", texte: "Démo en visio. Attend validation de son associé." },
      ],
    },
    {
      id: "c8", prenom: "Antoine", nom: "Dubois", entreprise: "Dubois Menuiserie",
      poste: "Gérant", email: "antoine@dubois-menuiserie.fr", telephone: "06 89 01 23 45",
      ville: "Crest", statut: "inactif", source: "Salon", createdAt: day(-400),
      notes: [],
    },
    {
      id: "c9", prenom: "Laura", nom: "Fontaine", entreprise: "Fontaine Événements",
      poste: "Directrice", email: "laura@fontaine-events.fr", telephone: "06 90 12 34 56",
      ville: "Nîmes", statut: "prospect", source: "Site web", createdAt: day(-4),
      notes: [],
    },
    {
      id: "c10", prenom: "Karim", nom: "Benali", entreprise: "KB Électricité",
      poste: "Artisan", email: "karim@kb-elec.fr", telephone: "07 01 23 45 67",
      ville: "Montélimar", statut: "client", source: "Recommandation", createdAt: day(-90),
      notes: [
        { id: "n8", date: day(-14), type: "email", texte: "Facture de mise en place réglée." },
      ],
    },
  ];

  const deals: Deal[] = [
    { id: "d1", titre: "Suivi interventions & pièces", contactId: "c2", montant: 4800, etape: "proposition", dateCloture: day(10), createdAt: day(-12) },
    { id: "d2", titre: "Outil devis + planning", contactId: "c4", montant: 2900, etape: "contacte", dateCloture: day(20), createdAt: day(-6) },
    { id: "d3", titre: "Agenda & fiches clientes", contactId: "c5", montant: 1900, etape: "nouveau", dateCloture: day(30), createdAt: day(-20) },
    { id: "d4", titre: "CRM cabinet de conseil", contactId: "c7", montant: 7500, etape: "negociation", dateCloture: day(5), createdAt: day(-15) },
    { id: "d5", titre: "Gestion des événements", contactId: "c9", montant: 5200, etape: "nouveau", dateCloture: day(35), createdAt: day(-4) },
    { id: "d6", titre: "Module allergènes", contactId: "c1", montant: 1200, etape: "proposition", dateCloture: day(7), createdAt: day(-3) },
    { id: "d7", titre: "Export mensuel des mandats", contactId: "c3", montant: 900, etape: "gagne", dateCloture: day(-8), createdAt: day(-25) },
    { id: "d8", titre: "Gestion des commandes", contactId: "c1", montant: 3400, etape: "gagne", dateCloture: day(-40), createdAt: day(-70) },
    { id: "d9", titre: "Maintenance annuelle", contactId: "c6", montant: 1800, etape: "gagne", dateCloture: day(-30), createdAt: day(-45) },
    { id: "d10", titre: "Mise en place CRM artisan", contactId: "c10", montant: 2600, etape: "gagne", dateCloture: day(-60), createdAt: day(-90) },
    { id: "d11", titre: "Suivi de chantiers", contactId: "c8", montant: 4100, etape: "perdu", dateCloture: day(-100), createdAt: day(-150) },
    { id: "d12", titre: "Tableau de bord flotte", contactId: "c6", montant: 3900, etape: "contacte", dateCloture: day(25), createdAt: day(-10) },
  ];

  const quotes: Quote[] = [
    {
      id: "q1", numero: "D-2026-014", contactId: "c2", date: day(-2), validiteJours: 30, statut: "envoye",
      lignes: [
        { id: "l1", designation: "Analyse des besoins et maquettes", quantite: 1, prixUnitaire: 800, tva: 20 },
        { id: "l2", designation: "Module interventions (planning, statuts)", quantite: 1, prixUnitaire: 2200, tva: 20 },
        { id: "l3", designation: "Module stock de pièces", quantite: 1, prixUnitaire: 1400, tva: 20 },
        { id: "l4", designation: "Formation de l'équipe (demi-journée)", quantite: 1, prixUnitaire: 400, tva: 20 },
      ],
    },
    {
      id: "q2", numero: "D-2026-013", contactId: "c1", date: day(-3), validiteJours: 30, statut: "brouillon",
      lignes: [
        { id: "l5", designation: "Module allergènes et fiches produits", quantite: 1, prixUnitaire: 1200, tva: 20 },
      ],
    },
    {
      id: "q3", numero: "D-2026-012", contactId: "c3", date: day(-26), validiteJours: 30, statut: "accepte",
      lignes: [
        { id: "l6", designation: "Export mensuel automatisé des mandats", quantite: 1, prixUnitaire: 900, tva: 20 },
      ],
    },
    {
      id: "q4", numero: "D-2026-011", contactId: "c7", date: day(-8), validiteJours: 30, statut: "envoye",
      lignes: [
        { id: "l7", designation: "CRM sur mesure (contacts, pipeline, relances)", quantite: 1, prixUnitaire: 5500, tva: 20 },
        { id: "l8", designation: "Tableaux de bord et exports", quantite: 1, prixUnitaire: 1500, tva: 20 },
        { id: "l9", designation: "Maintenance (mois)", quantite: 12, prixUnitaire: 80, tva: 20 },
      ],
    },
    {
      id: "q5", numero: "D-2026-009", contactId: "c8", date: day(-110), validiteJours: 30, statut: "refuse",
      lignes: [
        { id: "l10", designation: "Application de suivi de chantiers", quantite: 1, prixUnitaire: 4100, tva: 20 },
      ],
    },
  ];

  const tasks: Task[] = [
    { id: "t1", titre: "Relancer le devis D-2026-014", contactId: "c2", echeance: dateKey(0), type: "appel", faite: false },
    { id: "t2", titre: "Envoyer la proposition finale", contactId: "c7", echeance: dateKey(-1), type: "email", faite: false },
    { id: "t3", titre: "Premier appel de découverte", contactId: "c9", echeance: dateKey(1), type: "appel", faite: false },
    { id: "t4", titre: "Démo de l'outil devis", contactId: "c4", echeance: dateKey(3), type: "rdv", faite: false },
    { id: "t5", titre: "Finaliser le devis allergènes", contactId: "c1", echeance: dateKey(0), type: "autre", faite: false },
    { id: "t6", titre: "Prendre des nouvelles", contactId: "c5", echeance: dateKey(6), type: "email", faite: false },
    { id: "t7", titre: "Point trimestriel", contactId: "c3", echeance: dateKey(-9), type: "rdv", faite: true },
  ];

  return { contacts, deals, quotes, tasks };
}
