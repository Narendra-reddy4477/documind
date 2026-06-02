import uuid
import json
from pathlib import Path
from typing import List, Tuple
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_ollama import OllamaEmbeddings
import chromadb
from chromadb.config import Settings as ChromaSettings

from core.config import settings

# ── ChromaDB client (persistent) ─────────────────────────────
_chroma_client = chromadb.PersistentClient(
    path=settings.chroma_persist_dir,
    settings=ChromaSettings(anonymized_telemetry=False)
)

# ── Embeddings via Ollama ─────────────────────────────────────
# FIXED
def _get_embeddings():
    return OllamaEmbeddings(
        model=settings.embedding_model,
    )


def _get_collection(doc_id: str):
    """Get or create a ChromaDB collection for a document."""
    return _chroma_client.get_or_create_collection(
        name=f"doc_{doc_id}",
        metadata={"hnsw:space": "cosine"}
    )


# ── Text Splitter ─────────────────────────────────────────────
def _get_splitter():
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def index_document(doc_id: str, documents: List[Document]) -> int:
    """
    Chunk documents and store embeddings in ChromaDB.
    Returns number of chunks created.
    """
    splitter   = _get_splitter()
    embeddings = _get_embeddings()
    collection = _get_collection(doc_id)

    chunks = splitter.split_documents(documents)
    if not chunks:
        return 0

    texts    = [c.page_content for c in chunks]
    metadatas = [c.metadata for c in chunks]
    ids      = [str(uuid.uuid4()) for _ in chunks]

    # Generate embeddings
    vectors = embeddings.embed_documents(texts)

    collection.add(
        ids=ids,
        embeddings=vectors,
        documents=texts,
        metadatas=metadatas,
    )
    return len(chunks)


def similarity_search(
    doc_id: str, query: str, top_k: int = None
) -> List[Tuple[str, dict, str]]:
    """
    Search for top_k similar chunks for a query.
    Returns list of (text, metadata, chunk_id).
    """
    top_k      = top_k or settings.top_k_results
    embeddings = _get_embeddings()
    collection = _get_collection(doc_id)

    query_vector = embeddings.embed_query(query)

    results = collection.query(
        query_embeddings=[query_vector],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas"],
    )

    hits = []
    # FIXED
    if results["documents"] and results["documents"][0]:
        for i, (text, meta) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
        )):
            chunk_id = f"chunk_{i}"
            hits.append((text, meta, chunk_id))
    return hits


def delete_document(doc_id: str):
    """Remove a document's collection from ChromaDB."""
    try:
        _chroma_client.delete_collection(f"doc_{doc_id}")
    except Exception:
        pass


def document_exists(doc_id: str) -> bool:
    """Check if a document has been indexed."""
    try:
        col = _chroma_client.get_collection(f"doc_{doc_id}")
        return col.count() > 0
    except Exception:
        return False
