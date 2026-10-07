"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChevronsDownUp } from "lucide-react";
import type { AnatomyItem, SystemId } from "../data/anatomy";
import { systems } from "../data/anatomy";
import { searchAnatomy } from "../lib/anatomy-search";
import Icon from "./Icons";

type Props = {
  selectedId: string;
  onSelect: (item: AnatomyItem) => void;
  items: AnatomyItem[];
};

const MAX_FILTER_RESULTS = 250;

export default function Sidebar({ selectedId, onSelect, items }: Props) {
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const [openSystem, setOpenSystem] = useState<SystemId | null>(null);
  const [closedResults, setClosedResults] = useState<SystemId[]>([]);
  const searching = Boolean(deferredFilter.trim());
  const changeFilter = (value: string) => {
    setFilter(value);
    setClosedResults([]);
  };
  const matches = useMemo(
    () => deferredFilter.trim() ? searchAnatomy(items, deferredFilter) : items,
    [deferredFilter, items],
  );
  const visibleItems = searching ? matches.slice(0, MAX_FILTER_RESULTS) : matches;
  const isResultLimited = matches.length > visibleItems.length;

  const menu = useMemo(() => systems.map((system) => {
    const allSystemItems = items.filter((item) => item.category === system.id);
    const systemItems = visibleItems.filter((item) => item.category === system.id);
    const groups = Array.from(systemItems.reduce((result, item) => {
      const groupItems = result.get(item.group) ?? [];
      groupItems.push(item);
      result.set(item.group, groupItems);
      return result;
    }, new Map<string, AnatomyItem[]>()).entries());
    return { system, allSystemItems, systemItems, groups };
  }), [items, visibleItems]);

  return (
    <aside className="sidebar">
      <div className="sidebar-heading">
        <span>ANATOMİ KATALOĞU</span>
        <span>{items.length.toLocaleString("tr-TR")} YAPI</span>
        <button type="button" className="sidebar-collapse" title="Tüm menüleri kapat" aria-label="Tüm menüleri kapat" disabled={!openSystem && !searching} onClick={() => { setOpenSystem(null); changeFilter(""); }}><ChevronsDownUp size={16} /></button>
      </div>
      <label className="sidebar-search">
        <Icon name="search" size={15} />
        <input
          value={filter}
          onChange={(event) => changeFilter(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); changeFilter(""); } }}
          placeholder="Menüde filtrele…"
          aria-label="Anatomi menüsünü filtrele"
        />
        {filter && (
          <button type="button" onClick={() => changeFilter("")} aria-label="Menü filtresini temizle">
            <Icon name="close" size={13} />
          </button>
        )}
      </label>
      {searching && (
        <p className="sidebar-result-summary" aria-live="polite">
          {matches.length.toLocaleString("tr-TR")} eşleşme
          {isResultLimited ? ` · ilk ${MAX_FILTER_RESULTS} gösteriliyor` : ""}
        </p>
      )}
      <nav aria-label="Anatomi sistemleri">
        {menu.map(({ system, allSystemItems, systemItems, groups }) => {
          const isOpen = searching ? systemItems.length > 0 && !closedResults.includes(system.id) : openSystem === system.id;
          return (
            <section className={`system ${isOpen ? "open" : ""}`} key={system.id}>
              <button
                type="button"
                className="system-title"
                onClick={() => {
                  if (searching) setClosedResults(current => isOpen ? [...current, system.id] : current.filter(id => id !== system.id));
                  else setOpenSystem(isOpen ? null : system.id);
                }}
                aria-expanded={isOpen}
                aria-controls={`menu-${system.id}`}
              >
                <span className={`system-icon ${system.id}`}><Icon name={system.icon} size={19} /></span>
                <span>
                  <strong>{system.name}</strong>
                  <small>{allSystemItems.length.toLocaleString("tr-TR")} yapı · {isOpen ? "açık" : "kapalı"}</small>
                </span>
                <span className="accordion-arrow"><Icon name="chevron" size={17} /></span>
              </button>
              <div id={`menu-${system.id}`} hidden={!isOpen}>
                {isOpen && <SystemGroups key={deferredFilter.trim()} groups={groups} selectedId={selectedId} onSelect={onSelect} defaultExpanded={searching} />}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}

// Unmounting a closed system discards its subgroup state, including search folds.
function SystemGroups({ groups, selectedId, onSelect, defaultExpanded }: {
  groups: [string, AnatomyItem[]][];
  selectedId: string;
  onSelect: (item: AnatomyItem) => void;
  defaultExpanded: boolean;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  return <div className="structure-list">
    {groups.length ? groups.map(([group, groupItems]) => {
      const groupOpen = openGroups[group] ?? defaultExpanded;
      return <div className={`structure-group ${groupOpen ? "open" : ""}`} key={group}>
        <button type="button" className="structure-group-title" onClick={() => setOpenGroups(current => ({ ...current, [group]: !groupOpen }))} aria-expanded={groupOpen}>
          <span>{group}</span><b>{groupItems.length}</b><Icon name="chevron" size={13} />
        </button>
        {groupOpen && <div className="structure-group-items">
          {groupItems.map(item => <button type="button" key={item.id} onClick={() => onSelect(item)} className={selectedId === item.id ? "structure active" : "structure"} aria-current={selectedId === item.id ? "true" : undefined}>
            <span className="structure-dot" />
            <span>{item.turkish}<em>{item.latin}</em></span>
          </button>)}
        </div>}
      </div>;
    }) : <p className="sidebar-empty">Bu sistemde eşleşme yok.</p>}
  </div>;
}
