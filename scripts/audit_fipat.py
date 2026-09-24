"""Audit a generated atlas against the archived FIPAT TA2 PDF identifiers.

Usage:
  python scripts/audit_fipat.py --atlas app/data/atlas.generated.json \
    --pdf downloads/FIPAT-TA2-Part-2.pdf downloads/FIPAT-TA2-Part-3.pdf \
    downloads/FIPAT-TA2-Part-4.pdf downloads/FIPAT-TA2-Part-5.pdf

This is a legacy/compatibility audit. IFAA's current terminology is
Terminologia Anatomica Humana (TAH); passing this script does not certify TAH
coverage. The audit compares TA2 identifiers, not names or translations. A
medical editor must still approve Turkish labels and the teaching curriculum.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

TA2_ID = re.compile(r"\bA\d{2}(?:\.\d{1,3}){3,5}\b")

def pdf_ids(paths: list[Path]) -> set[str]:
    result: set[str] = set()
    for path in paths:
        for page in PdfReader(path).pages:
            result.update(TA2_ID.findall(page.extract_text() or ""))
    return result

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, nargs="+", required=True)
    parser.add_argument("--report", type=Path, default=Path("reports/fipat-coverage.json"))
    args = parser.parse_args()
    atlas = json.loads(args.atlas.read_text(encoding="utf-8"))
    source_ids = pdf_ids(args.pdf)
    atlas_ids = {str(item.get("ta2Id")) for item in atlas["structures"] if item.get("ta2Id")}
    missing, unknown = sorted(source_ids - atlas_ids), sorted(atlas_ids - source_ids)
    report = {"sourceTerms": len(source_ids), "atlasTerms": len(atlas_ids), "coverage": round(len(source_ids & atlas_ids) / max(len(source_ids), 1) * 100, 2), "missing": missing, "unknown": unknown}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"FIPAT coverage: {report['coverage']}% ({len(source_ids & atlas_ids)}/{len(source_ids)})")
    if missing:
        print(f"Release blocked: {len(missing)} TA2 identifiers are missing. See {args.report}", file=sys.stderr)
        raise SystemExit(1)

if __name__ == "__main__": main()
