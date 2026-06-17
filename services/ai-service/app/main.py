from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.postgres import get_pool, close_pool
from app.db.mongodb  import get_client
from app.routers     import profiles, recommendations


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    print("[db] PostgreSQL pool ready")
    get_client()
    print("[db] MongoDB client ready")
    yield
    await close_pool()


app = FastAPI(title="Universidad X — AI Service", version="1.0.0", lifespan=lifespan)

app.include_router(profiles.router)
app.include_router(recommendations.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}
