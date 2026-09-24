"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { AnatomyItem, SystemId } from "../data/anatomy";
import { systems } from "../data/anatomy";
import { searchAnatomy } from "../lib/anatomy-search";
import Icon from "./Icons";

type Props = {
  selectedId: string;
  onSelect: (item: AnatomyItem) => void;
  items: AnatomyItem[];
  openSystems: Record<SystemId, boolean>;
  onToggle: (system: SystemId) => void;
};

const MAX_FILTER_RESULTS = 250;

export default function Sidebar({ selectedId, onSelect, items, openSystems, onToggle }: Props) {
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const matches = useMemo(
    () => deferredFilter.trim() ? searchAnatomy(items, deferredFilter) : items,
    [deferredFilter, items],
  );
  const visibleItems = deferredFilter.trim() ? matches.slice(0, MAX_FILTER_RESULTS) : matches;
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
      </div>
      <label className="sidebar-search">
        <Icon name="search" size={15} />
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Menüde filtrele…"
          aria-label="Anatomi menüsünü filtrele"
        />
        {filter && (
          <button type="button" onClick={() => setFilter("")} aria-label="Menü filtresini temizle">
            <Icon name="close" size={13} />
          </button>
        )}
      </label>
      {deferredFilter.trim() && (
        <p className="sidebar-result-summary" aria-live="polite">
          {matches.length.toLocaleString("tr-TR")} eşleşme
          {isResultLimited ? ` · ilk ${MAX_FILTER_RESULTS} gösteriliyor` : ""}
        </p>
      )}
      <nav aria-label="Anatomi sistemleri">
        {menu.map(({ system, allSystemItems, systemItems, groups }) => {
          const isOpen = openSystems[system.id] || Boolean(deferredFilter.trim() && systemItems.length);
          return (
            <section className={`system ${isOpen ? "open" : ""}`} key={system.id}>
              <button
                type="button"
                className="system-title"
                onClick={() => onToggle(system.id)}
                aria-expanded={isOpen}
              >
                <span className={`system-icon ${system.id}`}><Icon name={system.icon} size={19} /></span>
                <span>
                  <strong>{system.name}</strong>
                  <small>{allSystemItems.length.toLocaleString("tr-TR")} yapı · {isOpen ? "açık" : "kapalı"}</small>
                </span>
                <span className="accordion-arrow"><Icon name="chevron" size={17} /></span>
              </button>
              {isOpen && (
                <div className="structure-list">
                  {systemItems.length ? groups.map(([group, groupItems]) => {
                    const groupKey = `${system.id}:${group}`;
                    const hasSelected = groupItems.some((item) => item.id === selectedId);
                    const groupOpen = Boolean(deferredFilter.trim()) || (groupKey in openGroups ? openGroups[groupKey] : hasSelected);
                    return (
                      <div className={`structure-group ${groupOpen ? "open" : ""}`} key={group}>
                        <button
                          type="button"
                          className="structure-group-title"
                          onClick={() => setOpenGroups((current) => ({ ...current, [groupKey]: !groupOpen }))}
                          aria-expanded={groupOpen}
                        >
                          <span>{group}</span><b>{groupItems.length}</b><Icon name="chevron" size={13} />
                        </button>
                        {groupOpen && (
                          <div className="structure-group-items">
                            {groupItems.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => {
                                  setOpenGroups((current) => ({ ...current, [groupKey]: true }));
                                  onSelect(item);
                                }}
                                className={selectedId === item.id ? "structure active" : "structure"}
                                aria-current={selectedId === item.id ? "true" : undefined}
                              >
                                <span className="structure-dot" />
                                <span>{item.turkish}<em>{item.latin}</em></span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }) : <p className="sidebar-empty">Bu sistemde eşleşme yok.</p>}
                </div>
              )}
            </section>
          );
        })}
      </nav>
      <div className="sidebar-tip">
        <Icon name="spark" size={18} />
        <p><strong>Çalışma yöntemi</strong><br />Grubu aç, terimi incele; sonra aynı sistemden quiz başlat.</p>
      </div>
    </aside>
  );
}
