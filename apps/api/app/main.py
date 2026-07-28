from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth, bot, catalog, community

app = FastAPI(
    title="d-Tech Platform API",
    description="Co-design platform for dementia tech — research, projects, community signal.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(community.router)
app.include_router(admin.router)
app.include_router(bot.router)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "dtech-api"}
