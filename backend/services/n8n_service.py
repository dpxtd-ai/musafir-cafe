"""
Musafir Cafe - n8n Webhook Service
Handles communicating with n8n webhook workflows for menu and order storage (Google Sheets / CRM).
"""
import requests
import logging
from typing import List, Dict, Any
from ..config import Config
from ..models.order_models import OrderRequest

logger = logging.getLogger(__name__)

# Curated fallback menu items if n8n webhook is temporarily unreachable
DEFAULT_FALLBACK_MENU = [
    {"ItemName": "Musafir Special Masala Chai", "Price": 40, "Category": "Chai & Beverages"},
    {"ItemName": "Cardamom Ginger Tea", "Price": 35, "Category": "Chai & Beverages"},
    {"ItemName": "Kulhad Chai", "Price": 45, "Category": "Chai & Beverages"},
    {"ItemName": "Classic Cold Coffee", "Price": 110, "Category": "Cold Brews & Shakes"},
    {"ItemName": "Hazelnut Frappe", "Price": 140, "Category": "Cold Brews & Shakes"},
    {"ItemName": "Dark Chocolate Shake", "Price": 130, "Category": "Cold Brews & Shakes"},
    {"ItemName": "Paneer Tikka Grilled Sandwich", "Price": 150, "Category": "Gourmet Sandwiches"},
    {"ItemName": "Cheese Corn & Jalapeno Sandwich", "Price": 130, "Category": "Gourmet Sandwiches"},
    {"ItemName": "Crispy Veg Burger", "Price": 90, "Category": "Burgers & Wraps"},
    {"ItemName": "Musafir Loaded Peri-Peri Fries", "Price": 120, "Category": "Snacks & Munchies"},
    {"ItemName": "Garlic Cheese Toast", "Price": 100, "Category": "Snacks & Munchies"},
    {"ItemName": "White Sauce Penne Pasta", "Price": 170, "Category": "Continental & Mains"},
    {"ItemName": "Hot Sizzling Brownie with Ice Cream", "Price": 140, "Category": "Desserts"}
]

class N8nService:
    @staticmethod
    def get_menu() -> List[Dict[str, Any]]:
        """
        Fetches menu items from the n8n webhook.
        If the external service is down or returns invalid response, returns fallback menu items.
        """
        try:
            resp = requests.get(Config.MENU_WEBHOOK_URL, timeout=Config.REQUEST_TIMEOUT_SECONDS)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
            logger.warning(f"Menu webhook returned non-200 or empty data ({resp.status_code}). Using fallback.")
        except Exception as e:
            logger.error(f"Failed to fetch menu from n8n webhook: {e}. Using fallback.")
        
        return DEFAULT_FALLBACK_MENU

    @staticmethod
    def submit_order(order_data: OrderRequest) -> Dict[str, Any]:
        """
        Submits customer order to n8n webhook which processes and stores to Google Sheets.
        Returns the parsed response with orderNumber.
        """
        payload = order_data.model_dump()
        try:
            resp = requests.post(
                Config.ORDER_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=Config.REQUEST_TIMEOUT_SECONDS
            )
            
            if resp.status_code != 200:
                raise Exception(f"Order webhook returned status {resp.status_code}: {resp.text}")

            result = resp.json()
            # Handle various casing keys returned by n8n nodes
            order_number = (
                result.get("orderNumber") or
                result.get("order_number") or
                result.get("OrderNumber") or
                result.get("orderNo") or
                result.get("order_id") or
                result.get("id")
            )

            if not order_number:
                # Fallback generator if n8n returned success without explicit number
                import time
                order_number = f"MC-{int(time.time())}"

            return {
                "success": True,
                "orderNumber": str(order_number),
                "raw": result
            }
        except Exception as e:
            logger.error(f"Error submitting order to n8n: {e}")
            raise e
