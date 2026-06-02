from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import documents, chat, health

app = FastAPI(
    title="DocuMind API",
    description="AI Document Intelligence — Chat with your documents using local LLMs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {
        "app":     "DocuMind",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "/health",
    }
