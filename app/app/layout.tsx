"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StoreProvider, useStore, isSignedIn, signOut, DEMO_USER } from "@/lib/store";
import { Icon, cx } from "@/components/ui";
import { todayKey } from "@/lib/format";

const NAV = [
  { href: "/app", label: "Tableau de bord", icon: "home" },
  { href: "/app/contacts", label: "Contacts", icon: "users" },
  { href: "/app/pipeline", label: "Pipeline", icon: "kanban" },
  { href: "/app/devis", label: "Devis", icon: "file" },
  { href: "/app/relances", label: "Relances", icon: "bell" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isSignedIn()) setAllowed(true);
    else router.replace("/");
  }, [router]);

  if (!allowed) return null;

  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, ready, reset } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const today = todayKey();
  const dueCount = data.tasks.filter((t) => !t.faite && t.echeance <= today).length;

  const logout = () => {
    signOut();
    router.push("/");
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-brand-200 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.href === "/app/relances" && dueCount > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-amber-950">
                {dueCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <button
          onClick={() => {
            if (confirm("Réinitialiser toutes les données de démonstration ?")) reset();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-200 hover:bg-white/5 hover:text-white"
        >
          <Icon name="refresh" />
          Réinitialiser la démo
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
            AD
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{DEMO_USER.name}</p>
            <p className="truncate text-xs text-brand-200">{DEMO_USER.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Barre latérale (ordinateur) */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-900 px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-8 flex flex-1 flex-col">{nav}</div>
      </aside>

      {/* Barre supérieure (mobile) */}
      <header className="no-print sticky top-0 z-40 flex items-center justify-between bg-brand-900 px-4 py-3 lg:hidden">
        <Brand />
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-md p-2 text-white hover:bg-white/10"
          aria-label="Menu"
        >
          <Icon name={menuOpen ? "x" : "menu"} />
        </button>
      </header>
      {menuOpen && (
        <div className="no-print fixed inset-x-0 top-[60px] bottom-0 z-40 flex flex-col bg-brand-900 px-4 pb-6 pt-2 lg:hidden">
          {nav}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {ready ? children : <p className="text-sm text-muted">Chargement…</p>}
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5 px-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-brand-900">
        A
      </span>
      <span className="text-base font-semibold text-white">Atelier CRM</span>
    </Link>
  );
}
