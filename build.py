#!/usr/bin/env python3
"""
Striker — tek komutla derle + doğrula.

    python3 build.py            # patch_v10 -> striker-dev/index.html + doğrulama
    python3 build.py --check    # derlemeden sadece mevcut build'i doğrula

Adımlar (brief'in DEVELOPMENT RULE'ı: derle -> çalıştır -> test et -> konsolu incele):
  1. güncel patch script'ini çalıştır (inner.html temelinden yeniden derle)
  2. çıkarılan modüle `node --check` (sözdizimi)
  3. tools/diag ile gömülü test paketini koştur (11 test)
  4. md5 + boyut + sürüm rozetini raporla

Herhangi bir adım başarısızsa çıkış kodu != 0 döner.
"""
import hashlib
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def _latest_patch() -> Path:
    """striker-dev/patch_vN.py dosyalarindan en buyuk N'li olani sec (arsivdekiler haric)."""
    cands = sorted(
        (int(m.group(1)), p) for p in (ROOT / "striker-dev").glob("patch_v*.py")
        if (m := re.match(r"patch_v(\d+)\.py$", p.name))
    )
    if not cands:
        return ROOT / "striker-dev" / "patch_v10.py"
    return cands[-1][1]


PATCH = _latest_patch()
OUT = ROOT / "striker-dev" / "index.html"
DIAG = ROOT / "tools" / "diag" / "run-diagnostics.mjs"


def run(cmd, **kw):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, **kw)


def md5(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()


def main() -> int:
    check_only = "--check" in sys.argv

    if not check_only:
        if not PATCH.exists():
            print(f"HATA: patch script yok: {PATCH}")
            return 2
        before = md5(OUT) if OUT.exists() else "-"
        print(f"[1/4] derleniyor: {PATCH.relative_to(ROOT)}")
        r = run([sys.executable, str(PATCH.relative_to(ROOT))])
        out = (r.stdout + r.stderr).strip()
        if r.returncode != 0:
            print(out)
            print("HATA: derleme başarısız (bir rep() çıpası eşleşmedi) — build DEĞİŞTİRİLMEDİ olmamalı, kontrol et")
            return 1
        print("      " + out.replace("\n", "\n      "))
        print(f"      md5: {before} -> {md5(OUT)}")
    else:
        print(f"[1/4] --check: derleme atlandı (aktif script: {PATCH.name})")

    html = OUT.read_text(encoding="utf-8")
    m = re.search(r'<script type="module" crossorigin>([\s\S]*?)</script>', html)
    if not m:
        print("HATA: bundle içinde modül script bulunamadı")
        return 1

    print("[2/4] node --check (sözdizimi)")
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as f:
        f.write(m.group(1))
        tmp = f.name
    r = run(["node", "--check", tmp])
    if r.returncode != 0:
        print(r.stderr)
        print("HATA: sözdizimi hatası")
        return 1
    print(f"      temiz ({len(m.group(1)):,} karakter)".replace(",", "."))

    print("[3/4] gömülü test paketi (tools/diag)")
    r = run(["node", str(DIAG.relative_to(ROOT)), str(OUT.relative_to(ROOT))])
    print("      " + r.stdout.strip().replace("\n", "\n      "))
    if r.returncode != 0:
        print("HATA: test paketi başarısız")
        return 1

    badge = re.findall(r"(?:FLIGHT BUILD|UÇUŞ SÜRÜMÜ) ([0-9][0-9.]* ?[A-Z]*)", html)
    print("[4/4] build özeti")
    print(f"      dosya : {OUT.relative_to(ROOT)}")
    print(f"      boyut : {len(OUT.read_bytes()):,} bayt".replace(",", "."))
    print(f"      md5   : {md5(OUT)}")
    print(f"      rozet : {sorted(set(badge))}")
    print("\nBAŞARILI — build hazır. Önizleme: python3 striker-dev/server.py → http://localhost:8080")
    return 0


if __name__ == "__main__":
    sys.exit(main())
