from fastapi import FastAPI
from backend.app.api.routes import company, customers, campaigns, auth
from backend.app.services.llm_service import LLMClient, OpenAIProvider

llm_client = LLMClient([OpenAIProvider()])

app = FastAPI(title="Blossomer GTM API v2")
app.include_router(company.router, prefix="/company", tags=["Company"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
