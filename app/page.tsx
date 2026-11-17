"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Icon, Input } from "@/components/ui";
import { DEMO_USER, signIn } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState(DEMO_USER.password);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (signIn(email, password)) {
      router.push("/app");
    } else {
      setError("Identifiants incorrects. Utilisez le compte de démonstration ci-dessous.");
    }
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Vos clients, vos devis et vos relances, enfin au même endroit.
          </h1>
          <p className="mt-4 text-brand-200">
            Un CRM simple, conçu sur mesure pour les petites entreprises qui gèrent encore
            tout sur Excel ou sur papier.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Fiches clients et historique des échanges",
              "Pipeline commercial en glisser-déposer",
              "Devis avec calcul automatique HT / TVA / TTC",
              "Relances du jour et tâches en retard",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 p-1">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-200/70">Application de démonstration — données fictives.</p>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Connexion</h2>
          <p className="mt-1 text-sm text-muted">Accédez à votre espace de démonstration.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Adresse email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Mot de passe">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full">
              Se connecter
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-xl bg-brand-50 p-4 text-sm ring-1 ring-brand-100">
            <p className="font-medium text-brand-900">Compte de démonstration</p>
            <p className="mt-1 text-brand-700">
              Email : <span className="font-mono">{DEMO_USER.email}</span>
              <br />
              Mot de passe : <span className="font-mono">{DEMO_USER.password}</span>
            </p>
            <p className="mt-2 text-xs text-brand-700/80">
              Les identifiants sont déjà remplis. Vos modifications restent dans votre navigateur.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold ${
          light ? "bg-white text-brand-900" : "bg-brand-600 text-white"
        }`}
      >
        A
      </span>
      <span className={`text-lg font-semibold ${light ? "text-white" : "text-ink"}`}>
        Atelier CRM
      </span>
    </div>
  );
}
