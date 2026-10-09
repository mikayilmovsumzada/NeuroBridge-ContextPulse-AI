"""Mock JSON fayllarını oxuyan kiçik köməkçi modul."""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MOCK_DIR = BASE_DIR / "mock_data"


def load_json(filename: str) -> dict:
    """mock_data/ qovluğundan JSON faylı oxuyub dict qaytarır."""
    with open(MOCK_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)
