from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    ollama_base_url:    str = "http://localhost:11434"
    ollama_model:       str = "llama3"
    embedding_model:    str = "nomic-embed-text"
    chroma_persist_dir: str = "./chromadb_store"
    upload_dir:         str = "./uploads"
    max_file_size_mb:   int = 20
    chunk_size:         int = 800
    chunk_overlap:      int = 150
    top_k_results:      int = 5

    model_config = {"env_file": ".env"}


settings = Settings()

# Ensure directories exist
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
