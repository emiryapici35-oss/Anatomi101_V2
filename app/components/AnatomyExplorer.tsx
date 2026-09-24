"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { anatomyItems, catalogVersion, systems, type AnatomyItem, type SystemId } from "../data/anatomy";
import { searchAnatomy } from "../lib/anatomy-search";
import { reconcileStoredStreak } from "../lib/daily";
import DailyChallengeModal from "./DailyChallengeModal";
import DetailCard from "./DetailCard";
import Icon from "./Icons";
import LatinReadingGuide from "./LatinReadingGuide";
import ProfileMenu from "./ProfileMenu";
import QuizCenter from "./QuizCenter";
import Sidebar from "./Sidebar";

const initialOpenSystems = Object.fromEntries(
  systems.map((system) => [system.id, system.id === "bones"]),
) as Record<SystemId, boolean>;

const initialItem = anatomyItems.find((item) => item.id === "femur-dexter") ?? anatomyItems[0];

export default function AnatomyExplorer() {
  const [selected, setSelected] = useState<AnatomyItem>(initialItem);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [latinGuideOpen, setLatinGuideOpen] = useState(false);
  const [quizAnswerConcealed, setQuizAnswerConcealed] = useState(false);
  const [openSystems, setOpenSystems] = useState<Record<SystemId, boolean>>(initialOpenSystems);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStreak(reconcileStoredStreak());
    setTheme(
      params.get("theme") === "dark" || (!params.has("theme") && localStorage.getItem("anatomy101:theme") === "dark")
        ? "dark"
        : "light",
    );
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("anatomy101:theme", theme);
  }, [theme]);

  const results = useMemo(
    () => query.trim() ? searchAnatomy(anatomyItems, query, 8) : [],
    [query],
  );
  const systemsById = useMemo(
    () => new Map(systems.map((system) => [system.id, system])),
    [],
  );

  const choose = (item: AnatomyItem) => {
    setSelected(item);
    setOpenSystems(Object.fromEntries(systems.map((system) => [system.id, system.id === item.category])) as Record<SystemId, boolean>);
    setQuery("");
    setFocused(false);
  };

  const toggle = (systemId: SystemId) => {
    setOpenSystems((current) => {
      const willOpen = !current[systemId];
      return Object.fromEntries(
        systems.map((system) => [system.id, willOpen && system.id === systemId]),
      ) as Record<SystemId, boolean>;
    });
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#quiz-main">Ana içeriğe geç</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Anatomi 101 ana sayfa">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>Anatomi <b>101</b></span>
        </a>
        <div
          className="search-wrap"
          role="combobox"
          aria-expanded={focused && Boolean(query)}
          aria-haspopup="listbox"
          aria-controls="anatomy-search-results"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setFocused(false);
          }}
        >
          <Icon name="search" size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Yapı, organ veya Latince terim ara..."
            aria-label="Anatomi terimi ara"
            aria-autocomplete="list"
          />
          {query && (
            <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="Aramayı temizle">
              <Icon name="close" size={16} />
            </button>
          )}
          {focused && query && (
            <div id="anatomy-search-results" className="suggestions" role="listbox" aria-label="Arama önerileri">
              {results.length ? results.map((item) => {
                const system = systemsById.get(item.category);
                return (
                  <button type="button" role="option" aria-selected="false" key={item.id} onClick={() => choose(item)}>
                    <span className={`result-icon ${item.accent}`}><Icon name={system?.icon ?? "organ"} size={16} /></span>
                    <span><strong>{item.latin}</strong><small>{item.turkish} · {item.group}</small></span>
                  </button>
                );
              }) : (
                <p><b>“{query}”</b> için eşleşme bulunamadı.<br />Yazım benzerleri de kontrol edildi.</p>
              )}
            </div>
          )}
        </div>
        <div className="top-actions">
          <button type="button" className="latin-guide-button" onClick={() => setLatinGuideOpen(true)}>
            <Icon name="book" size={17} /><span>Latince okuma</span>
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
          <span className="streak" aria-label={`${streak} günlük seri`}><span>✦</span> {streak} günlük seri</span>
          <ProfileMenu streak={streak} />
        </div>
      </header>

      <div className="workspace quiz-workspace" id="top">
        <Sidebar
          items={anatomyItems}
          selectedId={selected.id}
          onSelect={choose}
          openSystems={openSystems}
          onToggle={toggle}
        />
        <DetailCard item={selected} concealed={quizAnswerConcealed} />
        <QuizCenter
          items={anatomyItems}
          onFocusItem={setSelected}
          onQuizGuardChange={setQuizAnswerConcealed}
        />
      </div>

      <footer className="app-footer">
        <span>Anatomi 101 · Katalog {catalogVersion}</span>
        <p>Eğitim amaçlıdır; tanı veya tedavi kararı için kullanılmaz.</p>
        <nav aria-label="Yasal ve içerik bağlantıları">
          <Link href="/about">İçerik ve kaynaklar</Link>
          <Link href="/privacy">Gizlilik</Link>
        </nav>
      </footer>

      <DailyChallengeModal items={anatomyItems} onStreakChange={setStreak} />
      <LatinReadingGuide open={latinGuideOpen} onClose={() => setLatinGuideOpen(false)} />
    </main>
  );
}
