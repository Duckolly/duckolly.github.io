#!/usr/bin/env python3
"""Apply a minimal, repeatable Gargantua integration patch to the portfolio.

No downloads or third-party dependencies. Run from the checked-out Git repo:
    python apply_gargantua.py .
"""
from __future__ import annotations

import argparse
import shutil
from datetime import datetime, timezone
from pathlib import Path

MARKER = "// GARGANTUA V4 INLINE UPGRADE"
CSS_FILENAME = "cosmic-hero.css"
JS_FILENAME = "cosmic-hero.js"
FALLBACK_FILENAME = "gargantua-fallback.webp"


def apply(root: Path, check_only: bool = False) -> None:
    source_dir = Path(__file__).resolve().parent
    index_path = root / "index.html"
    js_path = root / "script.js"
    css_path = root / CSS_FILENAME

    for required in (index_path, js_path, root / JS_FILENAME, root / FALLBACK_FILENAME):
        if not required.is_file():
            raise RuntimeError(f"Missing required repository file: {required.name}")

    index = index_path.read_text(encoding="utf-8")
    js = js_path.read_text(encoding="utf-8")
    css = (source_dir / CSS_FILENAME).read_text(encoding="utf-8")

    css_tag = '  <link rel="stylesheet" href="./cosmic-hero.css?v=5">'
    js_tag = '  <script src="./cosmic-hero.js?v=5" defer></script>'
    if "cosmic-hero.css" not in index:
        needle = '<link rel="stylesheet" href="./styles.css">'
        if needle not in index:
            raise RuntimeError("Could not locate styles.css link in index.html")
        index = index.replace(needle, needle + "\n" + css_tag, 1)
    if "cosmic-hero.js" not in index:
        needle = '<script src="./script.js" defer></script>'
        if needle not in index:
            raise RuntimeError("Could not locate script.js tag in index.html")
        index = index.replace(needle, needle + "\n" + js_tag, 1)

    # The current public script.js ends inside an incomplete V4 IIFE.
    # Remove this unfinished add-on, preserving the working tab/router code.
    if MARKER in js:
        prefix = js.split(MARKER, 1)[0].rstrip()
        if not (prefix.startswith("(() => {") and "filterButtons.forEach(" in prefix):
            raise RuntimeError("Unexpected script.js before V4 marker; refusing unsafe rewrite")
        if not prefix.endswith("}));"):
            raise RuntimeError("Unexpected end of script.js before V4 marker")
        js = prefix + "\n  const year = document.getElementById('year');\n" \
             "  if (year) year.textContent = String(new Date().getFullYear());\n" \
             "})();\n"

    if not js.rstrip().endswith("})();"):
        raise RuntimeError("script.js does not end with IIFE closure; please inspect manually")

    expected = {index_path: index, js_path: js, css_path: css}
    if check_only:
        print("Check only: patch inputs validated. No repository files changed.")
        return

    changed = {path: content for path, content in expected.items()
               if not path.exists() or path.read_text(encoding="utf-8") != content}
    if not changed:
        print("Already applied: no changes necessary.")
        return

    backup_dir = root / ".gargantua-backup" / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir.mkdir(parents=True, exist_ok=True)
    for path, content in changed.items():
        if path.exists():
            shutil.copy2(path, backup_dir / path.name)
        path.write_text(content, encoding="utf-8")
        print("Patched:", path.name)

    print("Original files backed up in:", backup_dir.relative_to(root))
    print("Done. Run: node --check script.js && node --check cosmic-hero.js")
    print("Then commit index.html, script.js, cosmic-hero.css and push to GitHub.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repository", nargs="?", default=".", type=Path,
                        help="Path to local duckolly.github.io working tree")
    parser.add_argument("--check-only", action="store_true", help="Validate without writing")
    args = parser.parse_args()
    apply(args.repository.resolve(), args.check_only)


if __name__ == "__main__":
    main()
