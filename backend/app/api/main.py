from fastapi import FastAPI
from backend.app.api.routes import (
    company,
    accounts,
    personas,
    campaigns,
    auth,
    neon_auth,
    companies,  # New CRUD routes
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Blossomer GTM API v2")

# CORS middleware for frontend-backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",  # Vite dev server (update to match your frontend port)
        "https://your-production-frontend.com",  # TODO: Replace with real prod domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API endpoints (AI generation endpoints)
app.include_router(company.router, prefix="/api/company", tags=["Company"])
app.include_router(accounts.router, prefix="/api", tags=["Accounts"])
app.include_router(personas.router, prefix="/api", tags=["Personas"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(neon_auth.router, prefix="/api/neon-auth", tags=["Neon Auth"])

# Register CRUD endpoints (data management endpoints)
app.include_router(companies.router, prefix="/api", tags=["Companies CRUD"])

# Register demo endpoints (these are defined within their respective routers with the /demo prefix)
app.include_router(company.router, tags=["Demo"], include_in_schema=True)
app.include_router(accounts.router, tags=["Demo"], include_in_schema=True)
app.include_router(personas.router, tags=["Demo"], include_in_schema=True)
app.include_router(campaigns.router, tags=["Demo"], include_in_schema=True)


@app.get("/health")
def health_check():
    return {"status": "ok"}
