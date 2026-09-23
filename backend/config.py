"""
Musafir Cafe - Configuration Settings
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    
    # n8n Webhook Endpoints (as configured in Musafir Cafe workflow)
    MENU_WEBHOOK_URL = os.getenv(
        "MENU_WEBHOOK_URL",
        "https://ydnyan0804.app.n8n.cloud/webhook/menu"
    )
    ORDER_WEBHOOK_URL = os.getenv(
        "ORDER_WEBHOOK_URL",
        "https://ydnyan0804.app.n8n.cloud/webhook/order"
    )

    REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", 15))
