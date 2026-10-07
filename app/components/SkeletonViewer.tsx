"use client";

import { useEffect, useRef, useState } from "react";
import { Bone, Crosshair, Eye, EyeOff, LoaderCircle, Maximize2, Minimize2, Pause, RotateCcw, RotateCw, TriangleAlert, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { AnatomyItem } from "../data/anatomy";
import { createSkeletonScene, type CameraView, type SceneState, type MuscleView, type SectionAxis } from "../lib/skeleton-scene";
import { modelMeshNames, preferredModel, skeletonModels, muscleCoverage, jointCoverage, type SkeletonModel } from "../lib/skeleton-model";

export default function SkeletonViewer({ item, onSelect }: { item: AnatomyItem; onSelect: (id: string) => void }) {
  const [choice, setChoice] = useState<{ model: SkeletonModel; itemId: string }>({ model: preferredModel(item.id), itemId: item.id });
  const model = choice.itemId === item.id ? choice.model : preferredModel(item.id);
  const changeModel = (value: SkeletonModel) => setChoice({ model: value, itemId: item.id });

  return <SkeletonModelView key={model} item={item} model={model} onModelChange={changeModel} onSelect={(id) => {
    // A canvas selection stays in the current model and preserves its camera.
    setChoice({ model, itemId: id });
    onSelect(id);
  }} />;
}

function SkeletonModelView({ item, model, onModelChange, onSelect }: {
  item: AnatomyItem; model: SkeletonModel; onModelChange: (model: SkeletonModel) => void; onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createSkeletonScene> | null>(null);
  const handlers = useRef({ onSelect, onModelChange });
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SceneState>({ phase: "loading", matched: 0 });
  const [isolated, setIsolated] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [separation, setSeparation] = useState(0);
  const [muscleView, setMuscleView] = useState<MuscleView>("solid");
  const [bones, setBones] = useState(true);
  const [section, setSection] = useState<SectionAxis>("off");
  const [sectionPosition, setSectionPosition] = useState(50);
  const [cameraView, setCameraView] = useState<CameraView | null>("front");
  const [expanded, setExpanded] = useState(false);
  const isMuscle = model === "muscles";
  const isJoint = model === "joints";
  const currentCategory = item.category === (isMuscle ? "muscles" : isJoint ? "joints" : "bones");
  const focusLabel = isMuscle ? "Seçili kasa odaklan" : isJoint ? "Seçili ekleme odaklan" : "Seçili kemiğe odaklan";
  const isolateLabel = isMuscle ? "Yalnızca seçili kas" : isJoint ? "Yalnızca seçili eklem" : "Yalnızca seçili kemik";
  const ready = state.phase === "ready";
  const matched = ready && state.matched > 0;
  const represented = modelMeshNames(item.id, model).length > 0;

  useEffect(() => { handlers.current = { onSelect, onModelChange }; }, [onSelect, onModelChange]);

  useEffect(() => {
    if (!host.current) return;
    try {
      scene.current = createSkeletonScene(host.current, model, setState, (id) => handlers.current.onSelect(id), () => handlers.current.onModelChange("skull"), () => { setRotating(false); setCameraView(null); });
    } catch {
      // WebGL may be disabled by the browser or unavailable on this device.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report failure to initialize the external renderer.
      setState({ phase: "error", matched: 0, message: "Bu tarayıcıda 3D görüntü başlatılamadı. Donanım hızlandırmasını kontrol et." });
    }
    return () => { scene.current?.dispose(); scene.current = null; };
  }, [model, attempt]);

  useEffect(() => { scene.current?.select(currentCategory ? item.id : ""); }, [item.id, currentCategory, model, attempt]);
  useEffect(() => { scene.current?.isolate(isolated); }, [isolated, model, attempt]);
  useEffect(() => { scene.current?.rotate(rotating); }, [rotating, model, attempt]);
  useEffect(() => { scene.current?.separate(separation / 100); }, [separation, model, attempt]);
  useEffect(() => { scene.current?.muscleView(muscleView); }, [muscleView, model, attempt]);
  useEffect(() => { scene.current?.bones(bones); }, [bones, model, attempt]);
  useEffect(() => { scene.current?.section(section, sectionPosition); }, [section, sectionPosition, model, attempt]);

  useEffect(() => {
    if (!expanded) return;
    const frame = requestAnimationFrame(() => host.current?.closest("section")?.scrollIntoView({ block: "start" }));
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", escape); };
  }, [expanded]);

  return (
    <section className={`skeleton-viewer${isMuscle ? " muscle-viewer" : isJoint ? " joint-viewer" : ""}${expanded ? " viewer-expanded" : ""}`} id="model-main" aria-label={isMuscle ? "3D kas atlası" : isJoint ? "3D eklem atlası" : "3D iskelet atlası"}>
      <header className="skeleton-heading">
        <div><span className="eyebrow">3D ATLAS</span><h2>{isMuscle ? "Kas sistemi" : isJoint ? "Eklem sistemi" : model === "skeleton" ? "İskelet sistemi" : model === "skull" ? "Kafatası kemikleri" : "Kafatası taraması"}</h2></div>
        <div className="model-segments" role="group" aria-label="Model seçimi">
          {Object.entries(skeletonModels).map(([key, value]) => (
            <button key={key} type="button" aria-pressed={model === key} title={key === "scan" ? "Sağlanan tek parça kafatası" : value.label} onClick={() => { if (model !== key) onModelChange(key as SkeletonModel); }}>{value.label}</button>
          ))}
        </div>
      </header>
      <div className="skeleton-selection" aria-live="polite">
        <i className={matched ? "is-matched" : ""} />
        <div><strong>{represented || currentCategory ? item.turkish : skeletonModels[model].label}</strong><span>{represented || currentCategory ? item.latin : model === "skull" ? "22 ayrı kemik" : model === "scan" ? "SKULL_NIH3D" : isMuscle ? `${muscleCoverage.meshes} ayrı kas parçası` : isJoint ? "Eklem seçilmedi" : "Kemik seçilmedi"}</span></div>
        {matched && <span className="selection-badge">{isMuscle ? "Seçili kas" : isJoint ? "Seçili eklem" : "Seçili kemik"}</span>}
      </div>
      {(isMuscle || isJoint) && <div className="muscle-controls">
        <div className="muscle-control-row">
          <div className="model-segments" role="group" aria-label={isJoint ? "Eklem görünümü" : "Kas görünümü"}>
            <button type="button" disabled={!ready} aria-pressed={!isolated && muscleView === "solid"} onClick={() => { setIsolated(false); setMuscleView("solid"); }}>Anatomi</button>
            <button type="button" disabled={!ready} aria-pressed={!isolated && muscleView === "ghost"} onClick={() => { setIsolated(false); setMuscleView("ghost"); }}>Saydam</button>
            <button type="button" disabled={!matched} aria-pressed={isolated} onClick={() => setIsolated(true)}>{isJoint ? "Tek eklem" : "Tek kas"}</button>
          </div>
          <div className="muscle-actions">
            <button type="button" title={isJoint ? "Seçili eklemi gizle" : "Seçili kası gizle"} aria-label={isJoint ? "Seçili eklemi gizle" : "Seçili kası gizle"} disabled={!matched || isolated} onClick={() => scene.current?.hide()}><EyeOff size={18} /></button>
            <button type="button" title="Son gizlemeyi geri al" aria-label="Son gizlemeyi geri al" disabled={!state.hidden} onClick={() => scene.current?.undoHide()}><Undo2 size={18} /></button>
            <button type="button" title={isJoint ? "Çevredeki kemikleri göster" : "Kemikleri göster"} aria-label={isJoint ? "Çevredeki kemikleri göster" : "Kemikleri göster"} aria-pressed={bones} disabled={!ready} onClick={() => setBones(value => !value)}><Bone size={18} /></button>
          </div>
        </div>
        <div className="muscle-control-row">
          <label className="section-control"><span>Kesit</span><select aria-label="Kesit düzlemi" value={section} disabled={!ready} onChange={event => setSection(event.target.value as SectionAxis)}><option value="off">Kapalı</option><option value="sagittal">Sagittal</option><option value="coronal">Koronal</option><option value="axial">Transvers</option></select></label>
          {!!state.hidden && <span className="hidden-count">{state.hidden} gizleme</span>}
        </div>
        {section !== "off" && <label className="skull-separation muscle-section"><span>Kesit konumu</span><input aria-label="Kesit konumu" type="range" min="0" max="100" value={sectionPosition} onChange={event => setSectionPosition(Number(event.target.value))} /><output>{sectionPosition}%</output></label>}
      </div>}
      <div className="model-navigation">
        <div className="model-segments" role="group" aria-label="Bakış yönü">
          {([["front", "Ön"], ["back", "Arka"], ["right", "Sağ"], ["left", "Sol"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={cameraView === value && !rotating} disabled={!ready} onClick={() => { setCameraView(value); setRotating(false); scene.current?.rotate(false); scene.current?.direction(value); }}>{label}</button>)}
        </div>
        <button type="button" className="model-expand" title={expanded ? "Normal görünüme dön" : "Modeli genişlet"} aria-label={expanded ? "Normal görünüme dön" : "Modeli genişlet"} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
      </div>
      {model === "skull" && <label className="skull-separation"><span>Kemikleri ayır</span><input aria-label="Kafatası kemiklerini ayır" type="range" min="0" max="100" step="1" value={separation} disabled={!ready || isolated} onChange={(event) => setSeparation(Number(event.target.value))} /><output>{separation}%</output></label>}
      <div className="skeleton-viewport" aria-busy={state.phase === "loading"}>
        <div ref={host} className="skeleton-canvas" />
        {state.phase === "loading" && <div className="skeleton-overlay" role="status"><LoaderCircle className="model-spinner" size={28} /><strong>Model yükleniyor…</strong></div>}
        {state.phase === "error" && <div className="skeleton-overlay" role="alert"><TriangleAlert size={26} /><p>{state.message}</p><button type="button" onClick={() => { setState({ phase: "loading", matched: 0 }); setAttempt((value) => value + 1); }}><RotateCcw size={16} />Yeniden dene</button></div>}
        <div className="skeleton-tools" role="group" aria-label="3D görünüm araçları">
          <button type="button" title={focusLabel} aria-label={focusLabel} disabled={!matched} onClick={() => scene.current?.focus()}><Crosshair size={19} /></button>
          <button type="button" title={isolateLabel} aria-label={isolateLabel} aria-pressed={isolated && matched} disabled={!matched} onClick={() => setIsolated((value) => !value)}>{isolated && matched ? <EyeOff size={19} /> : <Eye size={19} />}</button>
          <span />
          <button type="button" title="Yakınlaştır" aria-label="Yakınlaştır" disabled={!ready} onClick={() => scene.current?.zoom(0.8)}><ZoomIn size={19} /></button>
          <button type="button" title="Uzaklaştır" aria-label="Uzaklaştır" disabled={!ready} onClick={() => scene.current?.zoom(1.25)}><ZoomOut size={19} /></button>
          <button type="button" title="Otomatik döndür" aria-label="Otomatik döndür" aria-pressed={rotating} disabled={!ready} onClick={() => setRotating((value) => !value)}>{rotating ? <Pause size={19} /> : <RotateCw size={19} />}</button>
          <button type="button" title="Görünümü sıfırla" aria-label="Görünümü sıfırla" disabled={!ready} onClick={() => { setIsolated(false); setRotating(false); setSeparation(0); setMuscleView("solid"); setBones(true); setSection("off"); setSectionPosition(50); setCameraView("front"); scene.current?.restore(); scene.current?.home(); }}><RotateCcw size={19} /></button>
        </div>
      </div>
      <footer className="skeleton-footer">
        <p aria-live="polite">{state.phase !== "ready" ? " " : isJoint ? !currentCategory ? "Eklem seçilmedi." : !matched ? "Bu ekleme ait yapılar kaynak modelde bulunmuyor." : `${item.turkish} · Ekleme katılan yapılar${isolated ? " · Tek eklem" : ""}${section !== "off" ? " · Yüzey kesiti" : ""}` : isMuscle ? !currentCategory ? "Kas seçilmedi." : !matched ? "Bu kas veya alt parçası, kaynak modelde ayrı bir yapı olarak bulunmuyor." : `${item.turkish}${isolated ? " · Tek kas" : ""}${section !== "off" ? " · Yüzey kesiti; doku içi ayrıntı içermez." : ""}` : model === "scan" ? "Orijinal tarama tek parça; ayrı kemik seçimi Kafatası modelinde mevcut." : item.group === "İşitme kemikçikleri" ? "İşitme kemikçikleri bu modellerde bulunmuyor." : item.category !== "bones" ? "Bu görünüm yalnızca iskelet kemiklerini içeriyor." : !matched ? "Bu görünümde seçili bir kemik yok." : isolated ? "Yalnızca seçili kemik gösteriliyor." : `${item.turkish} vurgulanıyor.`}</p>
        {isJoint ? <small>{jointCoverage.mapped}/{jointCoverage.catalog} katalog kaydı · Kemik, kıkırdak ve diskler · Bağ ve kapsül yüzeyleri mevcut değil.<br /><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D, © The Database Center for Life Science</a> licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC Attribution 4.0 International</a> · Dönüştürülmüş model</small> : isMuscle ? <small>{muscleCoverage.mapped}/{muscleCoverage.catalog} katalog kaydı · {muscleCoverage.meshes} model parçası<br /><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D, © The Database Center for Life Science</a> licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC Attribution 4.0 International</a> · Dönüştürülmüş model</small> : model === "skeleton" ? <small>Model: <a href="https://sketchfab.com/3d-models/ct-derived-human-skeleton-7235c83248574ce986dd9e8b35159afa" target="_blank" rel="noreferrer">Terrie Simmons-Ehrhardt</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></small> : model === "skull" ? <small><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D, © The Database Center for Life Science</a> · <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/" target="_blank" rel="noreferrer">CC BY-SA 2.1 JP</a> · GLB dönüşümü</small> : <small>SKULL_NIH3D · Kullanıcı tarafından sağlanan model</small>}
      </footer>
    </section>
  );
}
