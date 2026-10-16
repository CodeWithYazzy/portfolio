"""Regenerate the offline catalog after editing assets/projects.json."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
projects = json.loads((root / 'assets/projects.json').read_text())['projects']
(root / 'assets/projects.js').write_text(
    '// Generated from projects.json by tools/sync-catalog.py.\n'
    'window.PROJECT_CATALOG = ' + json.dumps(projects, indent=2) + ';\n'
)
