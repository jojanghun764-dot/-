import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
entries = []
for path in sorted((root / "assets").iterdir()):
    if not path.is_file():
        continue
    rel = path.relative_to(root).as_posix()
    commits = subprocess.check_output(
        ["git", "log", "--all", "--diff-filter=A", "--format=%H", "--", rel],
        cwd=root, text=True
    ).strip().splitlines()
    with Image.open(path) as image:
        size = list(image.size)
    entries.append({
        "path": rel,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "dimensions": size,
        "first_repository_commit": commits[-1] if commits else None,
        "source_evidence": "scripts/make-icon.py" if rel == "assets/app-icon-512.png" else None,
        "commercial_rights_verified": rel == "assets/app-icon-512.png",
    })
out = root / "release/asset-ledger.json"
out.write_text(json.dumps({
    "note": "A repository commit records when a file entered this project; it does not prove ownership or commercial reuse rights.",
    "assets": entries,
}, ensure_ascii=False, indent=2) + "\n")
print(f"Recorded {len(entries)} assets; {sum(x['commercial_rights_verified'] for x in entries)} have reproducible in-repository source evidence.")
