"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Contact, CrmData, Deal, Quote, Task } from "./types";
import { buildSeed } from "./seed";

const STORAGE_KEY = "crm-demo:data:v1";

type Updater = (data: CrmData) => CrmData;

interface Store {
  data: CrmData;
  ready: boolean;
  update: (fn: Updater) => void;
  reset: () => void;
  // Raccourcis
  contactById: (id: string | null) => Contact | undefined;
  upsertContact: (c: Contact) => void;
  deleteContact: (id: string) => void;
  upsertDeal: (d: Deal) => void;
  deleteDeal: (id: string) => void;
  upsertQuote: (q: Quote) => void;
  deleteQuote: (id: string) => void;
  upsertTask: (t: Task) => void;
  deleteTask: (id: string) => void;
}

const StoreContext = createContext<Store | null>(null);

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [item, ...list];

function load(): CrmData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CrmData;
  } catch {
    // stockage indisponible : on repart des données de démo
  }
  return buildSeed();
}

function save(data: CrmData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignoré : la démo fonctionne aussi sans persistance
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CrmData>({
    contacts: [],
    deals: [],
    quotes: [],
    tasks: [],
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(load());
    setReady(true);
  }, []);

  const update = useCallback((fn: Updater) => {
    setData((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const seed = buildSeed();
    save(seed);
    setData(seed);
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      ready,
      update,
      reset,
      contactById: (id) => data.contacts.find((c) => c.id === id),
      upsertContact: (c) => update((d) => ({ ...d, contacts: upsert(d.contacts, c) })),
      deleteContact: (id) =>
        update((d) => ({
          contacts: d.contacts.filter((c) => c.id !== id),
          deals: d.deals.filter((x) => x.contactId !== id),
          quotes: d.quotes.filter((x) => x.contactId !== id),
          tasks: d.tasks.map((t) => (t.contactId === id ? { ...t, contactId: null } : t)),
        })),
      upsertDeal: (x) => update((d) => ({ ...d, deals: upsert(d.deals, x) })),
      deleteDeal: (id) => update((d) => ({ ...d, deals: d.deals.filter((x) => x.id !== id) })),
      upsertQuote: (x) => update((d) => ({ ...d, quotes: upsert(d.quotes, x) })),
      deleteQuote: (id) => update((d) => ({ ...d, quotes: d.quotes.filter((x) => x.id !== id) })),
      upsertTask: (x) => update((d) => ({ ...d, tasks: upsert(d.tasks, x) })),
      deleteTask: (id) => update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) })),
    }),
    [data, ready, update, reset],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}

/* ---------- Session de démo (aucune vraie authentification) ---------- */

const AUTH_KEY = "crm-demo:session";

export const DEMO_USER = {
  email: "demo@atelier-crm.fr",
  password: "demo2026",
  name: "Alex Durand",
  role: "Gérant",
};

export function signIn(email: string, password: string) {
  const ok =
    email.trim().toLowerCase() === DEMO_USER.email && password === DEMO_USER.password;
  if (ok) {
    try {
      sessionStorage.setItem(AUTH_KEY, "1");
    } catch {}
  }
  return ok;
}

export function signOut() {
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {}
}

export function isSignedIn() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return true; // stockage bloqué : on laisse entrer dans la démo
  }
}
