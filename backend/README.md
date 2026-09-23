# Musafir Cafe - Backend Architecture (Python)

This directory contains the cleanly separated Python backend architecture for **Musafir Cafe**, extracted from the original single-file `index.html`.

## Architectural Highlights

1. **Separation of Concerns**:
   - `models/order_models.py`: Pydantic data validation schemas for `Customer` (with strict 10-digit mobile check and table number validations), `OrderItem`, `OrderRequest`, `OrderResponse`, and `MenuItem`.
   - `services/n8n_service.py`: Service layer decoupling external webhook communications (`MENU_API` and `ORDER_API`), resilience fallbacks, timeout management, and order number extraction.
   - `routes/menu_routes.py` & `routes/order_routes.py`: Modular Flask blueprints (and optional FastAPI router in `fastapi_app.py`) for clean REST endpoints.
   - `config.py`: Centralized environment configurations for webhooks, timeouts, and port.

2. **Flow & Logic Preservation**:
   - Webhook URL for menu: `https://ydnyan0804.app.n8n.cloud/webhook/menu`
   - Webhook URL for order: `https://ydnyan0804.app.n8n.cloud/webhook/order`
   - Exact payload shape preserved:
     ```json
     {
       "customer": {
         "orderType": "Home Delivery",
         "name": "Arjun Sharma",
         "mobile": "9876543210",
         "address": "123 MG Road, Pune"
       },
       "items": [
         { "item": "Musafir Special Masala Chai", "qty": 2, "price": 40, "subtotal": 80 }
       ],
       "total": 80
     }
     ```
   - Resilient fallback menu if external n8n endpoint is temporarily sleeping.

## How to Run the Python Backend

### 1. Flask Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the Flask app
python -m backend.app
```

### 2. FastAPI Backend
```bash
uvicorn backend.fastapi_app:app --host 0.0.0.0 --port 5000 --reload
```

## API Endpoints

- `GET /api/health`: Health status & webhook ping
- `GET /api/menu`: Returns categorized menu items
- `POST /api/order`: Validates customer details and places the order into n8n webhook (persisting into Google Sheets)
