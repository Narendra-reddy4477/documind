import httpx
from typing import AsyncGenerator, List
from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain.schema import Document

from core.config import settings


# ── System prompt ─────────────────────────────────────────────
RAG_PROMPT = PromptTemplate(
    input_variables=["context", "history", "question"],
    template="""You are DocuMind, an intelligent document assistant.
Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say "I couldn't find that in the document."
Always be concise, accurate, and cite which part of the document supports your answer.

--- DOCUMENT CONTEXT ---
{context}
--- END CONTEXT ---

--- CONVERSATION HISTORY ---
{history}
--- END HISTORY ---

User Question: {question}

Answer:"""
)

SUMMARY_PROMPT = PromptTemplate(
    input_variables=["text"],
    template="""Summarize the following document in 3-4 sentences.
Focus on the main topic, key points, and purpose of the document.
Be concise and professional.

Document:
{text}

Summary:"""
)


# FIXED
def _get_llm(streaming: bool = False):
    return OllamaLLM(
        model=settings.ollama_model,
        temperature=0.1,
        streaming=streaming,
    )


async def check_ollama_status() -> dict:
    """Ping Ollama to verify it's running and model is available."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            if r.status_code != 200:
                return {"connected": False, "model_loaded": False,
                        "model_name": settings.ollama_model,
                        "error": "Ollama not responding"}
            models = [m["name"] for m in r.json().get("models", [])]
            model_loaded = any(
                settings.ollama_model in m for m in models
            )
            return {
                "connected":    True,
                "model_loaded": model_loaded,
                "model_name":   settings.ollama_model,
                "error": None if model_loaded
                         else f"Model '{settings.ollama_model}' not pulled. Run: ollama pull {settings.ollama_model}"
            }
    except Exception as e:
        return {"connected": False, "model_loaded": False,
                "model_name": settings.ollama_model,
                "error": f"Cannot connect to Ollama: {str(e)}"}


def build_context(chunks: List[tuple]) -> str:
    """Format retrieved chunks into a clean context string."""
    parts = []
    for i, (text, meta, _) in enumerate(chunks, 1):
        page = meta.get("page", "?")
        parts.append(f"[Chunk {i} | Page {page}]\n{text}")
    return "\n\n".join(parts)


def build_history(history: List) -> str:
    """Format conversation history."""
    if not history:
        return "No previous conversation."
    lines = []
    for msg in history[-6:]:  # last 3 turns
        role = "User" if msg.role == "user" else "Assistant"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)


async def generate_answer(
    question: str,
    chunks: List[tuple],
    history: List,
) -> str:
    """Generate a RAG answer synchronously."""
    llm     = _get_llm(streaming=False)
    context = build_context(chunks)
    hist    = build_history(history)
    prompt  = RAG_PROMPT.format(
        context=context, history=hist, question=question
    )
    return await llm.ainvoke(prompt)


async def stream_answer(
    question: str,
    chunks: List[tuple],
    history: List,
) -> AsyncGenerator[str, None]:
    """Stream a RAG answer token by token."""
    llm     = _get_llm(streaming=True)
    context = build_context(chunks)
    hist    = build_history(history)
    prompt  = RAG_PROMPT.format(
        context=context, history=hist, question=question
    )
    async for token in llm.astream(prompt):
        yield token


async def generate_summary(text: str) -> str:
    """Summarize the first portion of a document."""
    llm    = _get_llm()
    # Use first 3000 chars for summary to keep it fast
    sample = text[:3000]
    prompt = SUMMARY_PROMPT.format(text=sample)
    return await llm.ainvoke(prompt)
