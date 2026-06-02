from fastapi import APIRouter
from models.schemas import OllamaStatus
from services.llm import check_ollama_status

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", response_model=OllamaStatus)
async def health_check():
    """Check if Ollama is running and model is loaded."""
    status = await check_ollama_status()
    return OllamaStatus(**status)
