import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict

STORE_PATH = Path("./doc_store.json")


def _load() -> Dict:
    if STORE_PATH.exists():
        with open(STORE_PATH) as f:
            return json.load(f)
    return {}


def _save(data: Dict):
    with open(STORE_PATH, "w") as f:
        json.dump(data, f, indent=2)


# FIXED
def create_document(
    doc_id: str,             # ← accept it as a parameter
    filename: str,
    file_type: str,
    file_size: int,
    file_path: str,
    chunk_count: int,
    summary: Optional[str] = None,
) -> Dict:
    doc = {
        "id":          doc_id,
        "filename":    filename,
        "file_type":   file_type,
        "file_size":   file_size,
        "file_path":   file_path,
        "chunk_count": chunk_count,
        "summary":     summary,
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    store = _load()
    store[doc_id] = doc
    _save(store)
    return doc


def get_document(doc_id: str) -> Optional[Dict]:
    return _load().get(doc_id)


def list_documents() -> List[Dict]:
    return list(_load().values())


def delete_document(doc_id: str) -> bool:
    store = _load()
    if doc_id not in store:
        return False
    del store[doc_id]
    _save(store)
    return True


def update_chunk_count(doc_id: str, count: int):
    store = _load()
    if doc_id in store:
        store[doc_id]["chunk_count"] = count
        _save(store)
