from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json

from models.schemas import ChatRequest, ChatResponse, SourceChunk
from services.vector_store import similarity_search, document_exists
from services.llm import stream_answer, generate_answer
from services.doc_store import get_document
from core.config import settings

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """
    Stream chat response using Server-Sent Events (SSE).
    The frontend reads tokens as they arrive — like ChatGPT.
    """
    doc = get_document(req.document_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    if not document_exists(req.document_id):
        raise HTTPException(422, "Document not indexed. Please re-upload.")

    # Retrieve relevant chunks
    chunks = similarity_search(
        req.document_id,
        req.question,
        top_k=settings.top_k_results
    )
    if not chunks:
        raise HTTPException(422, "No relevant content found for this question.")

    # Build sources for the frontend
    sources = [
        {
            "content":  chunk[0][:300],  # preview
            "page":     chunk[1].get("page"),
            "chunk_id": chunk[2],
        }
        for chunk in chunks
    ]

    async def event_generator():
        # First, send sources as metadata
        yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"

        # Then stream tokens
        async for token in stream_answer(req.question, chunks, req.history):
            yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'done', 'data': ''})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/ask", response_model=ChatResponse)
async def chat_ask(req: ChatRequest):
    """Non-streaming chat endpoint (full response at once)."""
    doc = get_document(req.document_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    chunks = similarity_search(
        req.document_id,
        req.question,
        top_k=settings.top_k_results
    )
    if not chunks:
        raise HTTPException(422, "No relevant content found.")

    answer = await generate_answer(req.question, chunks, req.history)

    sources = [
        SourceChunk(
            content=c[0][:300],
            page=c[1].get("page"),
            chunk_id=c[2],
        )
        for c in chunks
    ]

    return ChatResponse(
        answer=answer,
        sources=sources,
        model=settings.ollama_model,
    )
