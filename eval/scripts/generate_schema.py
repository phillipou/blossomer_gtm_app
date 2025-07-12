# eval/scripts/gen_schema.py
import json, importlib
from pathlib import Path
from backend.app.prompts.registry import TEMPLATE_REGISTRY

out_dir = Path(__file__).parents[1] / "schemas"
out_dir.mkdir(parents=True, exist_ok=True)

for name, entry in TEMPLATE_REGISTRY.items():
    schema = entry["response_model"].model_json_schema()
    (out_dir / f"{name}.schema.json").write_text(json.dumps(schema, indent=2))
print("✓ Schemas refreshed")
