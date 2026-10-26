"use client";

import { useEffect, useSyncExternalStore } from "react";
import styles from "./SiteDisplayControls.module.css";

type ThemePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "site-theme-preference";
const PREFERENCE_EVENT = "bababou-theme-preference";
// A private-session fallback is needed when browser storage is disabled.
// It never transmits or persists a new identifier.
let volatilePreference: ThemePreference | null = null;
const THEMES = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "auto", label: "Auto (system)", icon: "🌓" },
] as const;

function readPreference(): ThemePreference {
  if (volatilePreference !== null) return volatilePreference;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Storage is optional. Respect the system when it is not available.
  }
  return "auto";
}

function subscribePreference(notify: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) notify();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFERENCE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFERENCE_EVENT, notify);
  };
}

function effectiveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "auto") return preference;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const theme = effectiveTheme(preference);
  if (document.documentElement.dataset.theme !== theme) {
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme, preference },
      }),
    );
  }
}

/**
 * React replacement for approved local theme/print controls on all native Next pages.
 * No third-party script, analytics beacon or storage identifier is added.
 * The shared ThemeBootstrap applies the persisted preference before paint.
 */
export default function SiteDisplayControls() {
  const preference = useSyncExternalStore(
    subscribePreference,
    readPreference,
    () => "auto",
  );

  useEffect(() => {
    // Do not overwrite the early ThemeBootstrap value during hydration.
    if (readPreference() !== preference) return;

    applyTheme(preference);
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const update = () => {
      if (readPreference() === "auto") applyTheme("auto");
    };
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [preference]);

  function selectTheme(value: ThemePreference) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
      volatilePreference = null;
    } catch {
      // Keep the active choice and aria-pressed consistent in this tab only.
      volatilePreference = value;
    }
    applyTheme(value);
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
  }

  return (
    <section className={styles.controls} lang="en" aria-label="Page controls">
      <div className={styles.theme} role="group" aria-label="Display theme">
        {THEMES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={preference === value}
            onClick={() => selectTheme(value)}
            className={styles.button}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.print}
        onClick={() => window.print()}
      >
        Print / Save as PDF
      </button>
    </section>
  );
}
