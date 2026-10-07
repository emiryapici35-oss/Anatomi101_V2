"use client";

import { ChevronLeft, ChevronRight, Download, Eye, EyeOff, ImageOff, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnatomyItem } from "../data/anatomy";
import atlas from "../data/image-atlas.json";
import "./image-atlas.css";

type Props = { item: AnatomyItem; onSelect: (id: string) => void };
type Plate = typeof atlas.plates[number];

export default function ImageAtlas(props: Props) {
  return <AtlasGroup key={`${props.item.category}/${props.item.group}`} {...props} />;
}

function AtlasGroup({ item, onSelect }: Props) {
  const plates = atlas.plates.filter(plate => plate.category === item.category && plate.group === item.group);
  const selectedPlate = plates.find(plate => plate.items.some(part => part.id === item.id));
  const [choice, setChoice] = useState<{ selection: string; id: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const plate = (choice?.selection === item.id ? plates.find(plate => plate.id === choice.id) : undefined) ?? selectedPlate ?? plates[0];
  const index = plates.findIndex(candidate => candidate.id === plate?.id);
  const coverage = atlas.coverage.groups.find(group => group.category === item.category && group.group === item.group);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);

  return (
    <section id="model-main" className={`skeleton-viewer image-atlas${expanded ? " viewer-expanded" : ""}`} aria-label="Görsel anatomi atlası" data-atlas-group={item.group}>
      <header className="skeleton-heading">
        <div><span className="eyebrow">GÖRSEL ATLAS</span><h2>{item.group}</h2></div>
        <button type="button" className="model-expand" title={expanded ? "Dar görünüm" : "Geniş görünüm"} aria-label={expanded ? "Dar görünüm" : "Geniş görünüm"} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </header>
      <div className="skeleton-selection">
        <i className={plate?.items.some(part => part.id === item.id) ? "is-matched" : ""} />
        <div><strong>{item.turkish}</strong><span>{item.latin}</span></div>
      </div>
      {!selectedPlate && <p className="atlas-missing" role="status">Seçilen yapı ayrı olarak gösterilmiyor. Aşağıdaki levhalar bu bölgenin anatomik referanslarıdır.</p>}
      {selectedPlate && !plate?.items.some(part => part.id === item.id) && <p className="atlas-missing" role="status">Bu görünümde seçilen yapı yer almıyor.</p>}
      {plate ? <>
        <div className="atlas-pagination">
          <span>{coverage?.mapped}/{coverage?.total} yapı eşleştirildi</span>
          <nav aria-label="Atlas görsel sayfaları">
            <button type="button" title="Önceki görsel" aria-label="Önceki görsel" disabled={index <= 0} onClick={() => setChoice({ selection: item.id, id: plates[index - 1].id })}><ChevronLeft size={18} /></button>
            <output aria-live="polite">{index + 1} / {plates.length}</output>
            <button type="button" title="Sonraki görsel" aria-label="Sonraki görsel" disabled={index >= plates.length - 1} onClick={() => setChoice({ selection: item.id, id: plates[index + 1].id })}><ChevronRight size={18} /></button>
          </nav>
        </div>
        <select className="atlas-plate-select" aria-label="Anatomik görünüm" value={plate.id} onChange={event => setChoice({ selection: item.id, id: event.target.value })}>
          {plates.map((candidate, index) => <option key={candidate.id} value={candidate.id}>{index + 1}. {candidate.title}</option>)}
        </select>
        <PlateImage key={plate.id} plate={plate} item={item} onSelect={id => { setChoice({ selection: id, id: plate.id }); onSelect(id); }} />
      </> : <div className="atlas-empty"><ImageOff size={34} aria-hidden="true" /><strong>Bu alt menünün görselleri henüz hazır değil.</strong></div>}
      <footer className="skeleton-footer">
        {plate && <small><a href={plate.source.page} target="_blank" rel="noreferrer">{plate.source.name}</a> · {plate.source.author} · <a href={plate.source.licenseUrl} target="_blank" rel="noreferrer">{plate.source.license}</a><br />Özgün görsel ve kaynak dili korunmuştur. Türkçe–Latince karşılıklar ayrı bir katmandır.</small>}
      </footer>
    </section>
  );
}

function PlateImage({ plate, item, onSelect }: Props & { plate: Plate }) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [annotations, setAnnotations] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const hasPins = plate.items.some(part => part.point);
  const reset = () => { setZoom(1); scroll.current?.scrollTo({ top: 0, left: 0 }); };
  const changeZoom = (next: number) => {
    const viewport = scroll.current;
    const scale = next / zoom;
    const left = viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) * scale - viewport.clientWidth / 2 : 0;
    const top = viewport ? (viewport.scrollTop + viewport.clientHeight / 2) * scale - viewport.clientHeight / 2 : 0;
    setZoom(next);
    requestAnimationFrame(() => viewport?.scrollTo({ left, top }));
  };
  return <>
    <div className="atlas-toolbar" role="group" aria-label="Görsel kontrolleri">
      <button type="button" title="Uzaklaştır" aria-label="Uzaklaştır" disabled={zoom <= 1} onClick={() => changeZoom(Math.max(1, zoom - .5))}><ZoomOut size={18} /></button>
      <output aria-live="polite">%{Math.round(zoom * 100)}</output>
      <button type="button" title="Yakınlaştır" aria-label="Yakınlaştır" disabled={zoom >= 4} onClick={() => changeZoom(Math.min(4, zoom + .5))}><ZoomIn size={18} /></button>
      <button type="button" title="Görseli sığdır" aria-label="Görseli sığdır" onClick={reset}><RotateCcw size={18} /></button>
      {hasPins && <button type="button" title="İşaretler" aria-label="İşaretler" aria-pressed={annotations} onClick={() => setAnnotations(value => !value)}>{annotations ? <Eye size={18} /> : <EyeOff size={18} />}</button>}
      <a href={plate.src} download title="Özgün görseli indir" aria-label="Özgün görseli indir"><Download size={18} /></a>
    </div>
    <div className="atlas-figure-heading"><h3>{plate.title}</h3>{plate.schematic && <p>Şematik gösterim. Eşleştirme yapıyı belirtir; sağ-sol taraf veya kişiye özgü anatomi eşleştirmesi değildir.</p>}</div>
    <div className={`atlas-image-scroll${zoom > 1 ? " atlas-zoomed" : ""}`} ref={scroll} tabIndex={0} aria-label={`${plate.group} etiketli görseli`}
      onPointerDown={event => {
        if (zoom === 1 || event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
        drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={event => { if (drag.current) { event.currentTarget.scrollLeft = drag.current.left - event.clientX + drag.current.x; event.currentTarget.scrollTop = drag.current.top - event.clientY + drag.current.y; } }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      {failed ? <p role="alert">Görsel yüklenemedi. <button type="button" onClick={() => setFailed(false)}>Yeniden dene</button></p> :
        <figure className="atlas-image-stage" style={{ width: `${zoom * 100}%` }}>
          <div className="atlas-original" style={{ aspectRatio: `${plate.width} / ${plate.height}`, maxWidth: `${Math.min(1200, 1000 * plate.width / plate.height) * zoom}px` }}>
          {/* Original downloaded files remain byte-identical; annotations are separate UI. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plate.src} width={plate.width} height={plate.height} alt={`${plate.title}. ${plate.items.length ? `İlgili yapılar: ${plate.items.map(part => part.turkish).join(", ")}.` : "Bölgesel anatomi referansı."}`} onError={() => setFailed(true)} draggable={false} />
          {annotations && plate.items.map((part, index) => part.point && <button type="button" key={part.id} className={`atlas-pin${part.point[0] > 60 ? " atlas-pin-left" : ""}`} aria-label={`${part.turkish} (${part.latin}) seç`} aria-pressed={part.id === item.id} title={`${part.turkish} · ${part.latin}`} onClick={() => onSelect(part.id)} style={{ left: `${part.point[0]}%`, top: `${part.point[1]}%` }}><b>{index + 1}</b><span>{part.turkish}</span></button>)}
          </div>
        </figure>}
    </div>
    {!!plate.items.length && <details className="atlas-structures" open><summary>Türkçe · Latince <span>{plate.items.length}</span></summary><ol className="atlas-legend" aria-label="Görseldeki yapılar">
      {plate.items.map((part, index) => <li key={part.id}><button type="button" aria-label={`${part.turkish} (${part.latin}) seç`} aria-pressed={part.id === item.id} onClick={() => onSelect(part.id)}><span>{index + 1}</span><div><strong>{part.turkish}</strong><small>{part.latin}</small>{part.sourceLabel && <small className="atlas-source-label" lang="en">{part.sourceLabel}</small>}</div></button></li>)}
    </ol></details>}
  </>;
}
