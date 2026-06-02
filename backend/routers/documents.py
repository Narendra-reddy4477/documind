import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from core.config import settings
from models.schemas import DocumentOut
from services.parser import parse_document
from services.vector_store import index_document, delete_document as vdelete, document_exists
from services.llm import generate_summary
from services import doc_store

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {"pdf": "pdf", "docx": "docx", "txt": "txt"}


@router.get("/", response_model=list[DocumentOut])
async def list_documents():
    docs = doc_store.list_documents()
    return [DocumentOut(**d) for d in docs]


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # Validate file type
    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}")

    # Validate file size
    contents = await file.read()
    size_mb  = len(contents) / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise HTTPException(400, f"File too large. Max size: {settings.max_file_size_mb}MB")

    # Save file
    doc_id    = str(uuid.uuid4())
    file_path = Path(settings.upload_dir) / f"{doc_id}.{ext}"
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        # Parse document
        documents = parse_document(str(file_path), ext)
        if not documents:
            raise HTTPException(422, "Could not extract text from document.")

        # Index into ChromaDB
        chunk_count = index_document(doc_id, documents)

        # Generate summary from first document chunk
        full_text = " ".join([d.page_content for d in documents])
        summary   = await generate_summary(full_text)

        # Save metadata
        # FIXED — pass doc_id directly so it's saved correctly
        doc = doc_store.create_document(
            doc_id=doc_id,
            filename=file.filename,
            file_type=ext,
            file_size=len(contents),
            file_path=str(file_path),
            chunk_count=chunk_count,
            summary=summary,
        )

        return DocumentOut(**doc)

    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on failure
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(500, f"Processing failed: {str(e)}")


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: str):
    doc = doc_store.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentOut(**doc)


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    doc = doc_store.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    # Remove from vector store
    vdelete(doc_id)

    # Remove file
    fp = Path(doc["file_path"])
    if fp.exists():
        fp.unlink()

    # Remove from store
    doc_store.delete_document(doc_id)

    return {"message": "Document deleted successfully"}
