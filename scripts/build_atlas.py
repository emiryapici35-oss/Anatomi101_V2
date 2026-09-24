"""Build the versioned Anatomy 101 atlas from an openly licensed ontology.

This script deliberately does not scrape visual textbook pages. It ingests a
machine-readable ontology export (FMA/Uberon OBO/OWL), keeps source URIs and
synonyms, then emits the UI's static JSON. Review output with a medical editor
before publishing: ontology hierarchy is not a clinical curriculum by itself.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import requests
import yaml
from rdflib import Graph, RDF, RDFS, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = "https://purl.obolibrary.org/obo/uberon.owl"
SYSTEM_TERMS = {
    "bones": ["bone", "skeletal system"], "joints": ["joint", "articulation"],
    "muscles": ["muscle", "muscular system"], "nervous": ["nervous system", "nerve"],
    "circulatory": ["circulatory system", "blood vessel", "heart"],
    "respiratory": ["respiratory system", "lung", "trachea"],
    "digestive": ["digestive system", "intestine", "stomach"],
    "urinary": ["urinary system", "kidney", "ureter"], "genital": ["reproductive system"],
    "endocrine": ["endocrine system", "endocrine gland"], "sensory": ["sense organ", "eye", "ear"],
}

def label(graph: Graph, term: URIRef) -> str | None:
    value = next(graph.objects(term, RDFS.label), None)
    return str(value) if value else None

def synonyms(graph: Graph, term: URIRef) -> list[str]:
    props = (SKOS.altLabel, URIRef("http://www.geneontology.org/formats/oboInOwl#hasExactSynonym"))
    return sorted({str(value) for prop in props for value in graph.objects(term, prop)})

def bucket(name: str) -> str | None:
    normalized = name.casefold()
    for system, terms in SYSTEM_TERMS.items():
        if any(term in normalized for term in terms): return system
    return None

def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")

def descendants(graph: Graph, roots: Iterable[URIRef]) -> set[URIRef]:
    child_map: dict[URIRef, set[URIRef]] = defaultdict(set)
    for child, _, parent in graph.triples((None, RDFS.subClassOf, None)):
        if isinstance(child, URIRef) and isinstance(parent, URIRef): child_map[parent].add(child)
    result, queue = set(roots), list(roots)
    while queue:
        parent = queue.pop()
        for child in child_map[parent] - result: result.add(child); queue.append(child)
    return result

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--output", default=ROOT / "app/data/atlas.generated.json", type=Path)
    parser.add_argument("--overrides", default=ROOT / "scripts/atlas-overrides.yml", type=Path)
    args = parser.parse_args()
    response = requests.get(args.source, timeout=90); response.raise_for_status()
    graph = Graph(); graph.parse(data=response.content)
    overrides = yaml.safe_load(args.overrides.read_text(encoding="utf-8")) if args.overrides.exists() else {}
    roots = [term for term in graph.subjects(RDF.type, None) if (name := label(graph, term)) and bucket(name)]
    candidates = descendants(graph, roots)
    result = {"version": "2.0.0", "source": args.source, "structures": []}
    used: set[str] = set()
    for term in candidates:
        name = label(graph, term)
        if not name: continue
        system = bucket(name) or overrides.get(str(term), {}).get("system")
        if not system: continue
        identifier = slug(str(term).rsplit("/", 1)[-1].replace("_", "-"))
        if identifier in used: continue
        used.add(identifier)
        custom = overrides.get(str(term), {})
        result["structures"].append({"id": identifier, "ontologyId": str(term), "ta2Id": custom.get("ta2Id"), "system": system, "latin": custom.get("latin", name), "turkish": custom.get("turkish", name), "group": custom.get("group", "Tıbbi editör bekliyor"), "aliases": synonyms(graph, term), "svgId": custom.get("svgId", identifier)})
    result["structures"].sort(key=lambda item: (item["system"], item["latin"]))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(result['structures'])} structures to {args.output}")

if __name__ == "__main__": main()
