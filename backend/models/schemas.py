from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentOut(BaseModel):
    id:          str
    filename:    str
    file_type:   str
    file_size:   int
    chunk_count: int
    uploaded_at: str
    summary:     Optional[str] = None


class ChatMessage(BaseModel):
    role:    str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    document_id: str
    question:    str
    history:     list[ChatMessage] = []


class SourceChunk(BaseModel):
    content:  str
    page:     Optional[int] = None
    chunk_id: str


class ChatResponse(BaseModel):
    answer:  str
    sources: list[SourceChunk]
    model:   str


class OllamaStatus(BaseModel):
    connected:     bool
    model_loaded:  bool
    model_name:    str
    error:         Optional[str] = None
