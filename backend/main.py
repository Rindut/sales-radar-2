from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db import init_db
from routers import leads, outreach, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Sales Radar 2.0",
    description="Daily Lead Intelligence & Outreach Assistant for Bawana Sales Team",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:8001", "https://sales.bawana.xyz", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(outreach.router)
app.include_router(settings.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Sales Radar 2.0"}
