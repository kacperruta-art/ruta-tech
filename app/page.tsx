"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<"DE" | "EN">("DE");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Tłumaczenia
  const translations = {
    DE: {
      brandSub: "Facility Management System",
      emailLabel: "E-MAIL ADRESSE",
      passwordLabel: "PASSWORT",
      btnLogin: "Anmelden",
      btnLoading: "Verbindung...",
      backLink: "← Zur Hauptseite",
    },
    EN: {
      brandSub: "Facility Management System",
      emailLabel: "EMAIL ADDRESS",
      passwordLabel: "PASSWORD",
      btnLogin: "Login",
      btnLoading: "Connecting...",
      backLink: "← Back to Home",
    },
  };

  const t = translations[language];

  // Obsługa Dark Mode zgodnie z Twoim globals.css (.dark class)
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // LOGIN
    setTimeout(() => {
      setLoading(false);
      router.push("/studio");
    }, 1500);
  };

  return (
    
    <div className="flex min-h-screen w-full flex-col bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <header className="flex w-full items-center justify-between px-6 py-6">
        {/* LOGO TEXT */}
        <div className="flex items-center gap-1 text-lg font-bold tracking-tight">
          <span>RUTA</span>
          <span className="text-[var(--brand)]">//</span>
          <span>TECH</span>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-6 text-sm font-medium text-[var(--muted)]">
          <button
            onClick={handleThemeToggle}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            {isDark ? "LIGHT" : "DARK"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage("DE")}
              className={`transition-colors ${language === "DE" ? "text-[var(--foreground)] font-bold" : "hover:text-[var(--foreground)]"}`}
            >
              DE
            </button>
            <span className="opacity-30">|</span>
            <button
              onClick={() => setLanguage("EN")}
              className={`transition-colors ${language === "EN" ? "text-[var(--foreground)] font-bold" : "hover:text-[var(--foreground)]"}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        
        {/* CARD */}
        <div className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl animate-in fade-in zoom-in duration-500">
          
          {/* BRANDING CENTERED */}
          <div className="mb-8 flex flex-col items-center text-center">
            {/* Favicon jako logo */}
            <img src="/favicon.ico" alt="Logo" className="mb-6 h-12 w-12 object-contain opacity-90" />
            
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Admin Portal
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t.brandSub}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {t.emailLabel}
              </label>
              <input
                type="email"
                id="email"
                required
                disabled={loading}
                placeholder="admin@ruta-tech.ch"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                id="password"
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3.5 font-semibold text-white shadow-lg shadow-[var(--brand)]/20 transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? t.btnLoading : t.btnLogin}
            </button>
          </form>
        </div>

        {/* BACK LINK */}
        <div className="mt-8 text-center">
          <a href="https://ruta-tech.ch" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--brand)] transition-colors">
            {t.backLink}
          </a>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-[var(--muted)]">
        <p className="font-semibold">RUTA TECHNOLOGIES</p>
        <p>immo.ruta-tech.ch</p>
      </footer>

    </div>
  );
}