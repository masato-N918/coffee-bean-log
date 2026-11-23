from fastapi import FastAPI

from app.routers import beans, health

app = FastAPI(title="coffee-bean-log API")

app.include_router(health.router, prefix="/api")
app.include_router(beans.router, prefix="/api")
