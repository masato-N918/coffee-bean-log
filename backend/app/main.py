from fastapi import FastAPI

from app.routers import health

app = FastAPI(title="coffee-bean-log API")

app.include_router(health.router, prefix="/api")
