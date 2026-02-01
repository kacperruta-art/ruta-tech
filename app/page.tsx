"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<"DE" | "EN">("DE"); // for visual switcher
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Translations dictionary as required
  const translations = {
    DE: {
      brandSub: "Facility Management System",
      emailLabel: "> E-MAIL",
      passwordLabel: "> PASSWORT",
      btnLogin: "ANMELDEN",
      btnLoading: "VERBINDUNG...",
      backLink: "← Zur Hauptseite",
    },
    EN: {
      brandSub: "Facility Management System",
      emailLabel: "> E-MAIL",
      passwordLabel: "> PASSWORD",
      btnLogin: "LOGIN",
      btnLoading: "CONNECTING...",
      backLink: "← Back to Home",
    }
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      if (typeof document !== "undefined") {
        if (newTheme) {
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
      return newTheme;
    });
  };

  // Language switcher
  const handleLangSwitch = (lang: "DE" | "EN") => setLanguage(lang);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network/loading
    setTimeout(() => {
      setLoading(false);
      router.push("/studio");
    }, 1500);
  };

  // Short alias for current language
  const t = translations;

  return (
    <div className="wrapper">
      <header className="login-header">
        <div className="brand">
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            RUTA<span className="highlight">//</span>TECH
          </a>
        </div>
        <div className="header-right">
          <div className="theme-toggle">
            <button
              type="button"
              className="theme-toggle-btn"
              data-theme-toggle="true"
              aria-pressed={isDark}
              aria-label="Toggle dark mode"
              onClick={handleThemeToggle}
            >
              {isDark ? "DARK" : "LIGHT"}
            </button>
          </div>
          <div className="language-switcher" style={{ marginLeft: 16, display: "inline-block" }}>
            <span
              onClick={() => handleLangSwitch("DE")}
              style={{
                fontWeight: language === "DE" ? 700 : 400,
                cursor: "pointer",
                opacity: language === "DE" ? 1 : 0.55,
                letterSpacing: "0.02em",
                marginRight: 5,
              }}
              aria-current={language === "DE" ? "true" : undefined}
            >
              DE
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span
              onClick={() => handleLangSwitch("EN")}
              style={{
                fontWeight: language === "EN" ? 700 : 400,
                cursor: "pointer",
                opacity: language === "EN" ? 1 : 0.55,
                letterSpacing: "0.02em",
                marginLeft: 5,
              }}
              aria-current={language === "EN" ? "true" : undefined}
            >
              EN
            </span>
          </div>
          <div className="system-status" style={{ marginLeft: 24 }}>
            IMMO PORTAL
          </div>
        </div>
      </header>
      <main className="login-page">
        <div className="login-box">
          <div className="login-brand">
            RUTA<span className="highlight">//</span>TECH
          </div>
          <div className="login-sub">{t[language].brandSub}</div>
          <form id="loginForm" autoComplete="on" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">{t[language].emailLabel}</label>
              <input
                type="email"
                name="email"
                id="email"
                className="terminal-input"
                placeholder="name@domain.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">{t[language].passwordLabel}</label>
              <input
                type="password"
                name="password"
                id="password"
                className="terminal-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="blink" style={{ marginRight: 6, color: "#04f" }}>●</span>
                  {t[language].btnLoading}
                </>
              ) : (
                <>
                  <span className="bracket">[</span> {t[language].btnLogin} <span className="bracket">]</span>
                </>
              )}
            </button>
          </form>
          <p className="login-back" style={{ marginTop: 28 }}>
            <a href="/">{t[language].backLink}</a>
          </p>
        </div>
      </main>
      <footer style={{ marginTop: "auto", padding: "24px 0" }}>
        <div className="footer-col">
          <span className="mono">RUTA TECHNOLOGIES</span>
          <br />
          immo.ruta-tech.ch
        </div>
      </footer>
    </div>
  );
}
