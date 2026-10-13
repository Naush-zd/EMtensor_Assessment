from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import overview, departments, budget, tasks, components, people, anomalies

app = FastAPI(title="Surya Gram Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(budget.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(components.router, prefix="/api")
app.include_router(people.router, prefix="/api")
app.include_router(anomalies.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
