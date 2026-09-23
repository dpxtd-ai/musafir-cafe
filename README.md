# 🍽️ Musafir Cafe - Online Ordering System

> **Artisanal Cafe Digital Ordering & Management Platform**  
> *Created by **Dnyanchand Yadav***  
> Live Demo: [https://dpxtd-ai.github.io/musafir-cafe/](https://dpxtd-ai.github.io/musafir-cafe/)

---

## 📌 Project Overview

**Musafir Cafe** is a web-based digital ordering application designed for seamless cafe operations. Customers can easily place orders for **Home Delivery** or **Dine-In** directly from their mobile devices or desktop browsers.

The application communicates with automated **n8n workflows** to dynamically pull the live cafe menu and automatically record completed orders into **Google Sheets** for kitchen and billing management. In addition to a production-grade React & Vite frontend, the repository includes a clean, decoupled **Python backend architecture** (Flask & FastAPI).

---

## ✨ Key Features

1. **Dual Ordering Modes**:
   - 🏠 **Home Delivery**: Collects customer full name, 10-digit mobile number (with live validation), and detailed street address.
   - 🍽️ **Dine-In**: Quick customer entry with table number for rapid table-side service.

2. **Dynamic Live Menu & Search**:
   - Live integration with n8n menu webhook (`https://ydnyan0804.app.n8n.cloud/webhook/menu`).
   - Resilient built-in fallback menu ensuring zero downtime if external webhooks are sleeping.
   - Categorized accordions (Hot Chai & Brews, Sandwiches, Burgers, Munchies, Pasta, Desserts).
   - Real-time search filter and category jump navigation.
   - Interactive quantity steppers (`+` / `-`) with instant subtotal and grand total recalculation.

3. **Kitchen & CRM Webhook Integration**:
   - Posts orders directly to `https://ydnyan0804.app.n8n.cloud/webhook/order`.
   - Prevents double submissions with button locking and visual loading states.
   - Extracts and displays the official generated Order Number.

4. **Digital Receipt & Automatic Screenshot**:
   - Authentic cafe invoice card displaying order number, customer metadata, and an itemized breakdown.
   - **Automatic Screenshot Capture**: Automatically generates and downloads the receipt image (`html-to-image`) immediately upon order completion.
   - **🏠 Home Reset**: Easily returns to the starting screen to clear session state for the next guest.

5. **Python Backend Architecture**:
   - Fully separated backend located in `/backend/` with Pydantic validation schemas, service layer, and blueprints for both Flask and FastAPI.

---

## 📂 Project Architecture

```
musafir-cafe/
├── .github/
│   └── workflows/
│       └── static.yml         # GitHub Actions CI/CD for Vite build & GitHub Pages deployment
├── backend/                   # Python Backend Architecture
│   ├── app.py                 # Flask server application entry
│   ├── fastapi_app.py         # Asynchronous FastAPI alternative
│   ├── config.py              # Environment settings & webhook endpoints
│   ├── requirements.txt       # Python dependencies (Flask, FastAPI, Pydantic, etc.)
│   ├── README.md              # Dedicated documentation for the Python backend
│   ├── models/
│   │   └── order_models.py    # Pydantic schemas (Customer, OrderItem, OrderRequest)
│   ├── services/
│   │   └── n8n_service.py     # Webhook orchestrator & fallback menu logic
│   └── routes/
│       ├── menu_routes.py     # GET /api/menu route blueprint
│       └── order_routes.py    # POST /api/order route blueprint
├── public/
├── src/                       # Frontend Architecture (React + TypeScript)
│   ├── assets/
│   │   └── images/            # Cafe hero imagery
│   ├── components/
│   │   ├── Header.tsx         # Top navigation brand bar
│   │   ├── OrderTypeSelection.tsx # Step 1: Delivery vs Dine-in selector
│   │   ├── CustomerFormStep.tsx   # Step 2: Form with live validation
│   │   ├── MenuStep.tsx           # Step 3: Categorized menu, search & cart
│   │   └── OrderReceiptStep.tsx   # Step 4: Digital bill & auto-screenshot capture
│   ├── services/
│   │   └── cafeService.ts     # API client, n8n integration & storage helpers
│   ├── types/
│   │   └── cafe.ts            # TypeScript interfaces & types
│   ├── App.tsx                # State machine coordinating steps
│   ├── index.css              # Tailwind CSS imports & print styles
│   └── main.tsx               # React root entry
├── index.html                 # HTML entry point with fonts & metadata
├── package.json               # Frontend dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build settings (configured with relative base './')
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or v20 recommended)
- **npm** (v9 or v10)
- *(Optional for Python backend)*: **Python 3.10+**

---

### 1. Frontend Development (React + Vite)

```bash
# Clone the repository
git clone https://github.com/dpxtd-ai/musafir-cafe.git
cd musafir-cafe

# Install frontend dependencies
npm install --legacy-peer-deps

# Start the Vite local development server
npm run dev
```

Open your browser at `http://localhost:3000` or `http://localhost:5173`.

#### Building for Production:
```bash
npm run build
```
The compiled, minified bundle will be generated inside the `/dist` directory.

---

### 2. Running the Python Backend

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Run the Flask backend:
python -m backend.app

# OR run the FastAPI backend:
uvicorn backend.fastapi_app:app --host 0.0.0.0 --port 5000 --reload
```

---

## 🌐 Webhook Specification (n8n Integration)

### 1. Fetch Menu (`GET`)
- **Endpoint**: `https://ydnyan0804.app.n8n.cloud/webhook/menu`
- **Response Format**:
  ```json
  [
    {
      "ItemName": "Musafir Special Masala Chai",
      "Price": 40,
      "Category": "Hot Chai & Brews"
    },
    {
      "ItemName": "Paneer Tikka Grilled Sandwich",
      "Price": 140,
      "Category": "Gourmet Sandwiches"
    }
  ]
  ```

### 2. Place Order (`POST`)
- **Endpoint**: `https://ydnyan0804.app.n8n.cloud/webhook/order`
- **Request Payload**:
  ```json
  {
    "customer": {
      "orderType": "Home Delivery",
      "name": "Arjun Sharma",
      "mobile": "9876543210",
      "address": "Flat 302, Green Avenue, MG Road"
    },
    "items": [
      {
        "item": "Musafir Special Masala Chai",
        "qty": 2,
        "price": 40,
        "subtotal": 80
      }
    ],
    "total": 80
  }
  ```
- **Response Format**:
  ```json
  {
    "orderNumber": "MC-984210"
  }
  ```

---

## 🛠️ GitHub Pages Deployment

The repository includes a GitHub Actions workflow in `.github/workflows/static.yml` that:
1. Clones the repository on pushes to `main`.
2. Sets up Node.js 20.
3. Installs dependencies using `npm install --legacy-peer-deps`.
4. Executes `npm run build` (with `base: './'` in `vite.config.ts` for relative asset paths).
5. Deploys `./dist` directly to GitHub Pages.

---

## 👨‍💻 Author

Created by **Dnyanchand Yadav**  
GitHub: [@dpxtd-ai](https://github.com/dpxtd-ai)
