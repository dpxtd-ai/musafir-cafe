"""
Musafir Cafe - FastAPI Backend Server Alternative
Asynchronous high-performance implementation using FastAPI and Pydantic.
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import httpx
import time
from .config import Config
from .models.order_models import OrderRequest, OrderResponse, MenuItem
from .services.n8n_service import DEFAULT_FALLBACK_MENU

app = FastAPI(
    title="Musafir Cafe API",
    description="Backend API service for Musafir Cafe online ordering and n8n webhook orchestration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Musafir Cafe FastAPI",
        "menu_webhook": Config.MENU_WEBHOOK_URL,
        "order_webhook": Config.ORDER_WEBHOOK_URL
    }

@app.get("/api/menu", response_model=List[Dict[str, Any]])
async def get_menu():
    """Fetch menu from n8n webhook or fallback menu items."""
    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT_SECONDS) as client:
        try:
            resp = await client.get(Config.MENU_WEBHOOK_URL)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception:
            pass
    return DEFAULT_FALLBACK_MENU

@app.post("/api/order", response_model=OrderResponse)
async def submit_order(order: OrderRequest):
    """Submit order to n8n webhook which persists to Google Sheets."""
    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT_SECONDS) as client:
        try:
            resp = await client.post(
                Config.ORDER_WEBHOOK_URL,
                json=order.model_dump(),
                headers={"Content-Type": "application/json"}
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"n8n webhook error: {resp.text}"
                )
            result = resp.json()
            order_number = (
                result.get("orderNumber") or
                result.get("order_number") or
                result.get("OrderNumber") or
                result.get("orderNo") or
                result.get("order_id") or
                result.get("id") or
                f"MC-{int(time.time())}"
            )
            return OrderResponse(
                success=True,
                orderNumber=str(order_number),
                message="Order placed successfully with Musafir Cafe",
                orderData=order
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to submit order: {str(e)}"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.fastapi_app:app", host="0.0.0.0", port=Config.PORT, reload=Config.DEBUG)
