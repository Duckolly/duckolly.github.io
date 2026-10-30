#!/usr/bin/env python3
"""Static integration checks for the Gargantua CSS/WebGL hero."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def main(root: Path) -> int:
    checks = []
    files = {name: root / name for name in (
        "index.html", "script.js", "styles.css", "cosmic-hero.css",
        "cosmic-hero.js", "gargantua-fallback.webp")}
    for name, path in files.items():
        checks.append((f"File: {name}", path.is_file() and path.stat().st_size > 0))
    if not all(path.is_file() for path in files.values()):
        for name, passed in checks: print(("PASS" if passed else "FAIL"), name)
        return 1

    html = files["index.html"].read_text(encoding="utf-8")
    js = files["script.js"].read_text(encoding="utf-8")
    css = files["cosmic-hero.css"].read_text(encoding="utf-8")
    engine = files["cosmic-hero.js"].read_text(encoding="utf-8")

    checks.extend([
        ("CSS is linked after styles.css", html.find('href="./styles.css"') >= 0
         and html.find('cosmic-hero.css') > html.find('href="./styles.css"')),
        ("WebGL is linked after script.js", html.find('src="./script.js"') >= 0
         and html.find('cosmic-hero.js') > html.find('src="./script.js"')),
        ("Truncated V4 block removed", "GARGANTUA V4 INLINE UPGRADE" not in js),
        ("Main script ends correctly", js.rstrip().endswith("})();")),
        ("Responsive CSS custom properties", "--gargantua-scale" in css and "@media (max-width: 620px)" in css),
        ("WebGL canvas generated", "cosmic-canvas" in engine and "webgl2" in engine),
        ("Navigation generated", "cosmic-nav" in engine and "cosmic-link" in engine),
        ("Fallback is WebP", files["gargantua-fallback.webp"].read_bytes()[:4] == b"RIFF"),
    ])
    node = shutil.which("node")
    if node:
        for name in ("script.js", "cosmic-hero.js"):
            result = subprocess.run([node, "--check", str(files[name])], capture_output=True, text=True)
            checks.append((f"JavaScript syntax: {name}", result.returncode == 0))
            if result.returncode: print(result.stderr)
    else:
        print("SKIP node --check: Node.js is not installed")

    for name, passed in checks:
        print(("PASS" if passed else "FAIL"), name)
    result = all(passed for _, passed in checks)
    print("Static integration checks:", "PASSED" if result else "FAILED")
    return 0 if result else 1


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()))
