# 🌍 EcoScan — Clothing Carbon Footprint Scanner & Circular Rewards

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com)
[![Tests Passing](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)]()

> **EcoScan** is a production-grade full-stack web application designed to empower conscious consumerism. Users upload or capture photos of clothing items, an AI vision pipeline identifies the garments, calculates life-cycle carbon footprints ($\text{kg CO}_2\text{e}$), quantifies emissions avoided relative to fast-fashion benchmarks, awards **EcoPoints**, and unlocks redeemable circular partner rewards.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [Project Directory Structure](#-project-directory-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Running Tests](#-running-tests)
- [🌱 Carbon Scoring Methodology & Assumptions](#-carbon-scoring-methodology--assumptions)
- [🎁 Eco-Savings & Points Formula](#-eco-savings--points-formula)
- [🔌 API Endpoints Documentation](#-api-endpoints-documentation)
- [🚀 Product Enhancements & Technical Scaling Proposals](#-product-enhancements--technical-scaling-proposals)
- [🚢 Deployment Guide](#-deployment-guide)

---

## 🏛️ Architecture & Tech Stack

```
                                    ┌───────────────────────────────────────────────────────┐
                                    │                   EcoScan Frontend                    │
                                    │      (React 18 + Vite + TypeScript + Tailwind CSS)    │
                                    └───────────────────────────┬───────────────────────────┘
                                                                │
                                          HTTP / JSON (RESTful API via Vite Reverse Proxy)
                                                                │
                                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                   EcoScan Backend (FastAPI)                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  API Layer (FastAPI v1 Endpoints)                                                                                             │
│  ├── POST /api/v1/scan          (Multipart image upload or base64 camera snapshot)                                            │
│  ├── GET  /api/v1/offers        (Partner rewards catalog with dynamic unlock calculation)                                     │
│  ├── POST /api/v1/offers/redeem (Point deduction and unique promo voucher generation)                                         │
│  ├── GET  /api/v1/history       (Lifetime carbon ledger and scan timeline)                                                    │
│  ├── DELETE /api/v1/history    (Session state reset for demo runs)                                                           │
│  └── GET  /api/v1/health        (Liveness, version, and Azure AI Foundry status)                                              │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Domain & Service Layer                                                                                                       │
│  ├── VisionService              (Azure OpenAI GPT-4o Vision client with resilient offline heuristic fallback)                 │
│  ├── CarbonService              (Category normalization, material multipliers, LCA lifecycle calculator)                      │
│  ├── RewardService              (Eco-savings benchmark comparison & EcoPoints formula)                                        │
│  └── OfferService               (Partner offer eligibility, locking/unlocking, and redemption)                                │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Storage Layer                                                                                                                │
│  └── InMemoryStore              (Thread-safe in-memory session repository protecting concurrent requests)                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Highlights
- **Backend**: Python 3.12, FastAPI, Pydantic v2 (strict validation & schemas), Uvicorn, Pillow (image verification), HTTPX, Pytest.
- **Image Recognition**: Azure AI Foundry / Azure OpenAI GPT-4o Vision model with structured JSON schema output, plus an offline heuristic classification engine when API credentials are not provided.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React (modern iconography), Canvas-Confetti (micro-celebrations).
- **Security**: Magic-byte image inspection, 10MB payload size guard, content-type whitelisting, base64 sanitization.
- **Hardware Integration**: Native HTML5 camera capture via `navigator.mediaDevices.getUserMedia` with front/rear lens flipping and automatic track cleanup.

---

## ✨ Key Features

1. **Dual Image Input**:
   - **Drag-and-Drop Dropzone**: Select or drop JPEG, PNG, or WebP images with instant thumbnail preview.
   - **Live Webcam / Mobile Camera**: Center apparel in a custom reticle viewfinder, toggle between front and rear cameras, and snap high-resolution frames.
   - **Instant Apparel Presets**: 1-click test drives for evaluators (e.g., Organic Cotton Tee, Classic Denim Trucker, Recycled Runners) to verify the lifecycle without needing local image files.
2. **Cradle-to-Grave Carbon Accounting**:
   - Transparent baseline scores + material multipliers (synthetics penalty, organic savings, recycled discounts, circular vintage bonus).
   - Real-world impact equivalencies: equivalent passenger car miles driven, smartphone charges, and tree seedling-years needed to offset.
   - Actionable garment care and maintenance tips (cold water washing, line drying, microfiber wash bags).
3. **Eco-Reward Points & Circular Offers**:
   - Automated points calculation rewarding conscious scanning, emissions avoided, and low-carbon efficiency.
   - Tiered partner discounts (Patagonia Worn Wear, Guppyfriend, Veja, Reformation, Trees for Life, Organic Basics).
   - Real-time progress bars, 1-click voucher redemption, and copyable promo codes.
4. **Lifetime Sustainability History**:
   - Aggregate statistics: total scans, garments analyzed, total $\text{kg CO}_2\text{e}$ monitored, $\text{kg CO}_2\text{e}$ saved, and active points.
   - Chronological scan timeline with item badges and grade ratings.
   - Session reset button for fresh demoing.

---

## 📁 Project Directory Structure

```
EcoScan/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entrypoint, CORS & error handlers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & Azure AI credentials
│   │   │   └── constants.py         # Garment baselines, material multipliers, partner catalog
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic v2 DTOs (GarmentItem, ScanResponse, Offer)
│   │   ├── services/
│   │   │   ├── vision_service.py    # Azure OpenAI GPT-4o client with fallback
│   │   │   ├── carbon_service.py    # Carbon scoring calculation engine
│   │   │   ├── reward_service.py    # Eco-savings and EcoPoints formula
│   │   │   └── offer_service.py     # Offer eligibility & voucher management
│   │   ├── storage/
│   │   │   └── memory_store.py      # Thread-safe in-memory session store
│   │   └── api/
│   │       └── v1/
│   │           ├── router.py        # Master v1 API router
│   │           └── endpoints/
│   │               ├── scan.py      # POST /api/v1/scan
│   │               ├── offers.py    # GET /api/v1/offers & POST /api/v1/offers/{id}/redeem
│   │               ├── history.py   # GET /api/v1/history & DELETE /api/v1/history
│   │               └── health.py    # GET /api/v1/health
│   ├── tests/
│   │   ├── test_carbon_service.py   # Baselines, category normalization, multipliers
│   │   ├── test_reward_service.py   # Eco-savings & bonus point calculations
│   │   ├── test_offers.py           # Lock/unlock state, redemption, deductions
│   │   ├── test_image_validation.py # Magic-bytes, corrupted bytes, size limits
│   │   └── test_api_endpoints.py    # Integration tests using FastAPI TestClient
│   ├── pytest.ini                   # Pytest configuration
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Backend configuration template
│   └── run.sh                       # Backend runner script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Brand header with points counter and mode indicator
│   │   │   ├── TabNavigation.tsx    # Mobile & desktop tab switcher
│   │   │   ├── common/
│   │   │   │   ├── Badge.tsx        # Reusable status/grade badge
│   │   │   │   └── StatCard.tsx     # Metric card for lifetime stats
│   │   │   ├── Scanner/
│   │   │   │   ├── ImageDropzone.tsx# Drag-and-drop upload with validation
│   │   │   │   ├── CameraCapture.tsx# HTML5 webcam capture & lens toggle
│   │   │   │   ├── SamplePicker.tsx # Preset apparel samples
│   │   │   │   ├── ScanningLoader.tsx# Animated multistep progress indicator
│   │   │   │   ├── GarmentCard.tsx  # Per-garment breakdown card
│   │   │   │   ├── ScanResults.tsx  # Carbon score hero, equivalents, confetti
│   │   │   │   └── ScannerView.tsx  # Scanner tab root coordinator
│   │   │   ├── Redeem/
│   │   │   │   ├── OfferCard.tsx    # Brand voucher card with progress bar
│   │   │   │   ├── RedeemModal.tsx  # Promo code reveal dialog with copy button
│   │   │   │   └── OffersView.tsx   # Redeem tab coordinator with category filters
│   │   │   └── History/
│   │   │       └── HistoryView.tsx  # Lifetime impact ledger & scan timeline
│   │   ├── services/
│   │   │   └── api.ts               # Typed frontend HTTP client
│   │   ├── types/
│   │   │   └── index.ts             # Domain TypeScript interfaces
│   │   ├── test/
│   │   │   ├── setup.ts             # Vitest browser API mocks
│   │   │   └── components.test.tsx  # UI component & interaction tests
│   │   ├── App.tsx                  # Global state & notifications
│   │   ├── index.css                # Tailwind directives & scan animations
│   │   └── main.tsx                 # React DOM root entrypoint
│   ├── index.html                   # HTML template
│   ├── package.json                 # Node dependencies & scripts
│   ├── tsconfig.json                # Strict TypeScript configuration
│   ├── tailwind.config.js           # Theme and brand color palette
│   ├── vite.config.ts               # Vite configuration with /api reverse proxy
│   └── .env.example                 # Frontend configuration template
├── .env.example                     # Global configuration template
├── run_dev.sh                       # Concurrent full-stack development launcher
└── README.md                        # Documentation & enhancement proposals
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Python**: `3.12.11` (or Python $\ge 3.11$)
- **Node.js**: $\ge 18.0.0$ (tested on Node v26)
- **Package Managers**: `pip` and `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ecoscan.git
cd ecoscan
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

---

## 🔐 Environment Configuration

Copy the sample environment file in the `backend/` folder:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:
```ini
# Application Metadata
PROJECT_NAME="EcoScan API"
VERSION="1.0.0"
API_V1_STR="/api/v1"

# Azure AI Foundry / Azure OpenAI GPT-4o Credentials
# (If left empty, EcoScan automatically activates its high-fidelity offline heuristic classifier)
AZURE_OPENAI_API_KEY=""
AZURE_OPENAI_ENDPOINT="https://<your-resource-name>.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
AZURE_OPENAI_API_VERSION="2024-08-01-preview"

# Upload Constraints
MAX_IMAGE_SIZE_BYTES=10485760
MOCK_VISION_FALLBACK=true
```

> **Note on Vision Resilience:** If Azure credentials are not supplied or if Azure OpenAI experiences a network timeout/rate limit, the backend seamlessly falls back to its offline heuristic engine. This ensures the full application remains 100% testable out-of-the-box in offline or evaluation environments.

---

## 🏃 Running the Application

### Option A: Launch Both with One Command (Recommended)
From the project root:
```bash
./run_dev.sh
```
This starts both the FastAPI backend and the Vite frontend concurrently.

### Option B: Run Services Individually

**Terminal 1 — Backend (FastAPI)**:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API is accessible at: `http://localhost:8000`
- Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`
- Interactive ReDoc: `http://localhost:8000/redoc`

**Terminal 2 — Frontend (Vite + React)**:
```bash
cd frontend
npm run dev
```
- Web Application is accessible at: `http://localhost:5173`
- The Vite development server automatically proxies `/api` requests to `http://localhost:8000`.

---

## 🧪 Running Tests

Both backend and frontend feature automated test suites covering business logic, calculations, security validation, and UI interactions.

### 1. Backend Tests (Pytest)
```bash
cd backend
.venv/bin/pytest -v
```
**Test Coverage**:
- `test_carbon_service.py`: Verifies baseline emissions for all garments, category alias matching, material multipliers, eco-grade thresholds, and real-world equivalents.
- `test_reward_service.py`: Verifies EcoPoints formula, savings multipliers, low-footprint efficiency bonuses, and contextual tips.
- `test_offers.py`: Verifies initial catalog state, unlock logic based on point thresholds, successful voucher redemption, point deductions, and conflict rejection on duplicate/insufficient redemptions.
- `test_image_validation.py`: Verifies security filtering against non-image payloads, corrupted headers, empty files, and payloads exceeding 10MB.
- `test_api_endpoints.py`: End-to-end integration tests for `/scan` (file upload & base64), `/offers`, `/offers/{id}/redeem`, `/history`, and `DELETE /history`.

### 2. Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm test
```
**Test Coverage**:
- `components.test.tsx`: Component tests for `Badge`, `StatCard`, `GarmentCard`, `OfferCard` (locked vs unlocked state transitions), and `TabNavigation`.

### 3. Production Frontend Build Verification
```bash
cd frontend
npm run build
```
Ensures strict TypeScript compliance with zero type or build errors.

---

## 🌱 Carbon Scoring Methodology & Assumptions

Apparel carbon footprints are estimated using Life Cycle Assessment (LCA) methodologies following cradle-to-grave accounting (raw material extraction, yarn spinning, fabric weaving/knitting, wet processing & dyeing, assembly, distribution, consumer laundering, and end-of-life disposal).

### 1. Baseline Garment Emissions ($C_{\text{baseline}}$)
Sourced from research by WRAP (Waste & Resources Action Programme), the Ellen MacArthur Foundation, and Mistra Future Fashion:

| Garment Category | Baseline Footprint ($C_{\text{baseline}}$) | LCA Reference / Typical Composition |
| :--- | :--- | :--- |
| **T-Shirt** | **5.0 kg $\text{CO}_2\text{e}$** | Conventional cotton jersey (approx. 180–220g) |
| **Jeans / Denim** | **10.0 kg $\text{CO}_2\text{e}$** | Heavyweight twill cotton, intensive washing & distressing |
| **Jacket** | **15.0 kg $\text{CO}_2\text{e}$** | Multi-layer outerwear, hardware, synthetic insulation |
| **Shoes / Sneakers** | **8.0 kg $\text{CO}_2\text{e}$** | Rubber/EVA soles, adhesives, synthetic or leather upper |
| **Hoodie / Sweatshirt** | **8.5 kg $\text{CO}_2\text{e}$** | Heavy cotton/polyester fleece blend |
| **Dress** | **11.0 kg $\text{CO}_2\text{e}$** | Medium-length woven fabric (viscose/cotton/poly) |
| **Sweater / Knitwear** | **9.0 kg $\text{CO}_2\text{e}$** | Bulky wool or acrylic knitwear |
| **Shorts** | **4.0 kg $\text{CO}_2\text{e}$** | Lightweight cotton or athletic polyester weave |
| **Skirt** | **5.5 kg $\text{CO}_2\text{e}$** | Lightweight woven or pleated fabric |
| **Coat / Parka** | **18.0 kg $\text{CO}_2\text{e}$** | Heavy insulation, wool/down/weatherproof shell |
| **Trousers / Chinos** | **7.5 kg $\text{CO}_2\text{e}$** | Tailored woven cotton/linen/poly blend |
| **Activewear / Leggings** | **4.5 kg $\text{CO}_2\text{e}$** | High elastane/spandex/synthetic technical fabric |
| **Other / Mixed** | **6.0 kg $\text{CO}_2\text{e}$** | Industry average baseline across mixed apparel |

### 2. Material & Sustainability Impact Multipliers ($M_{\text{material}}$)
Fabric selection dramatically impacts lifecycle emissions:

| Material Type | Multiplier ($M_{\text{material}}$) | Rationale |
| :--- | :--- | :--- |
| **Virgin Synthetics** (Polyester, Nylon, Acrylic) | $\times 1.25$ | Petroleum extraction and energy-intensive polymerisation |
| **Conventional Cotton / Denim** | $\times 1.00$ | Standard agricultural fertilizer, irrigation, and dyeing |
| **Organic Cotton / Linen / Hemp** | $\times 0.70$ | Eliminates synthetic fertilizers, reduces pesticides & water |
| **Recycled Fibers** (rPET, recycled cotton) | $\times 0.50$ | Substantially bypasses raw extraction & virgin processing |
| **Heavy Animal Fibers** (Leather, Virgin Wool) | $\times 1.40$ – $1.50$ | High agricultural methane emissions and toxic tanning |
| **Thrifted / Vintage / Second-Hand** | $\times 0.30$ | Avoids 100% of primary manufacturing & agricultural impact |

$$\text{Item Actual Footprint } (C_{\text{actual}}) = C_{\text{baseline}} \times M_{\text{material}}$$

---

## 🎁 Eco-Savings & Points Formula

### 1. Fast-Fashion Benchmark Footprint ($C_{\text{benchmark}}$)
To measure carbon savings, every garment is compared against a conventional fast-fashion benchmark ($C_{\text{benchmark}} = C_{\text{baseline}} \times 1.25$):

$$\text{Item Eco-Savings } (\Delta \text{CO}_2) = \max\left(0, \, C_{\text{benchmark}} - C_{\text{actual}}\right)$$
$$\text{Total Scan Savings } = \sum_{i=1}^{n} \Delta \text{CO}_{2, i}$$

### 2. EcoPoints Award Formula
Points motivate consumers to choose sustainable materials, circular fashion, and conscious logging:

$$\text{Total EcoPoints} = \text{Base Points} + \text{Savings Points} + \text{Efficiency Bonus}$$

Where:
1. **Conscious Logging Base Points:** $+10\text{ pts}$ per completed scan.
2. **Savings Multiplier:** $+20\text{ pts}$ per $1.0\text{ kg CO}_2\text{e}$ avoided:
   $$\text{Savings Points} = \lfloor \Delta \text{CO}_2 \times 20 \rfloor$$
3. **Low-Impact Efficiency Bonus:** $+15\text{ pts}$ awarded if the average footprint of garments in the scan is $\le 6.0\text{ kg CO}_2\text{e}$.

#### Calculation Example:
A user scans an **Organic Cotton Crewneck**:
- Category Baseline: $5.0\text{ kg CO}_2\text{e}$
- Material Multiplier: $\times 0.70$
- Actual Footprint: $C_{\text{actual}} = 5.0 \times 0.70 = 3.5\text{ kg CO}_2\text{e}$
- Fast-Fashion Benchmark: $C_{\text{benchmark}} = 5.0 \times 1.25 = 6.25\text{ kg CO}_2\text{e}$
- Eco-Savings Avoided: $\Delta \text{CO}_2 = 6.25 - 3.5 = 2.75\text{ kg CO}_2\text{e}$
- Savings Points: $\lfloor 2.75 \times 20 \rfloor = 55\text{ pts}$
- Low-Impact Efficiency Bonus: $3.5\text{ kg} \le 6.0\text{ kg} \implies +15\text{ pts}$
- Base Points: $+10\text{ pts}$
- **Total Points Awarded**: $10 + 55 + 15 = \mathbf{80\text{ EcoPoints}}$

---

## 🔌 API Endpoints Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/scan` | Analyzes image via multipart upload (`file`) or form field (`image_base64`). Validates file format/size, extracts garments via vision pipeline, computes emissions, awards EcoPoints, and persists to session. |
| `GET` | `/api/v1/offers` | Lists all partner discount vouchers with real-time unlock status (`is_unlocked`, `progress_percent`) based on user's current point balance. |
| `POST` | `/api/v1/offers/{id}/redeem`| Deducts offer cost from user's points, marks voucher as redeemed, and returns a unique promo code. |
| `GET` | `/api/v1/history` | Returns lifetime sustainability metrics (scans count, total kg CO₂, total kg CO₂ saved, points) and chronological scan list. |
| `DELETE`| `/api/v1/history` | Resets in-memory demo session back to default welcome balance (50 pts). |
| `GET` | `/api/v1/health` | Health check endpoint returning service status, version, and Azure AI Foundry configuration state. |

Full interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

---

## 🚀 Product Enhancements & Technical Scaling Proposals

### 1. Technical Scaling (Handling High User Traffic)
- **Distributed Caching (Redis)**: Cache vision recognition embeddings and category carbon scores with Redis. Repeated uploads of similar product photos or stock images can bypass the LLM vision step entirely, cutting inference latency from $\sim 1.5\text{s}$ to $< 15\text{ms}$.
- **Asynchronous Task Queue (Celery / ARQ / RabbitMQ)**: Decouple heavy vision processing from the HTTP request-response cycle. The frontend receives an immediate `202 Accepted` ticket with WebSocket subscription or polling endpoint for smooth real-time progress updates.
- **Relational Persistence & Migration (PostgreSQL + SQLAlchemy + Alembic)**: Transition from in-memory storage to PostgreSQL with read-replicas, partitioning user scan ledgers by `user_id` and indexing on timestamps.
- **Object Storage & CDN Offloading (Azure Blob Storage / AWS S3 + CloudFront)**: Stream user image uploads directly to signed presigned URLs in Blob Storage, removing bandwidth load from backend app servers.
- **Edge Inference**: For instant mobile recognition, deploy an optimized ONNX-quantized YOLOv10 clothing segmentation model running directly in browser WebAssembly/WebGL or edge worker, using Azure GPT-4o only for ambiguous garments.

### 2. Enhanced Eco-Score Model (Accurate Data Integration)
- **Higg Index / MSI Integration**: Connect to the Sustainable Apparel Coalition's Higg Materials Sustainability Index (MSI) to replace estimated averages with verified cradle-to-gate mill-level emission coefficients.
- **Garment Weight Estimation**: Incorporate depth estimation from camera capture to calculate estimated textile grams ($\text{GSM} \times \text{area}$), transforming generic category scores into mass-accurate emission calculations.
- **Brand ESG Scoring (Good On You API)**: Cross-reference recognized brand logos with the Good On You ethical brand directory to factor corporate supply-chain practices, labor conditions, and renewable energy adoption into the score.
- **Garment Longevity / Circulytics**: Score the expected wash cycles before failure based on weave type and hardware quality.

### 3. User Experience & Community Features
- **Virtual Wardrobe Carbon Audit**: Allow users to save scanned garments into a personal digital closet, visualizing wardrobe-level carbon footprint breakdowns (e.g., "Outerwear accounts for 48% of your clothing emissions").
- **Outfit Carbon Budget**: Daily or monthly carbon allowances gamifying sustainable outfit choices.
- **Thrifting & Repair Assistant**: Integrations with local cobblers and repair services when a worn garment is scanned, offering point bonuses for repairing instead of replacing.

### 4. Real-Time External API Integrations
- **Real-Time Grid Carbon Intensity (Electricity Maps / WattTime API)**: Adjust laundry care recommendations according to the live marginal carbon intensity of the user's regional power grid.
- **Automated Affiliate Voucher Settlement**: Integrate directly with partner e-commerce platforms (Shopify / BigCommerce / WooCommerce) via webhooks to auto-generate single-use checkout coupons and credit affiliate commissions back into the circular rewards pool.

---

## 🚢 Deployment Guide

### Option 1: Docker Containerization
```dockerfile
# Multi-stage Dockerfile builds both backend and frontend into a lightweight production container
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/static
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 2: Cloud PaaS Deployment
- **Backend**: Deploy to **Azure App Service** or **Azure Container Apps** with environment variables set in the Azure portal.
- **Frontend**: Deploy to **Vercel** or **Netlify** with `VITE_API_BASE_URL` pointing to your deployed Azure backend endpoint.

---

### 🌱 Building a circular, carbon-conscious future with EcoScan!
Built for the **Reewild Full-Stack Engineer Challenge**.
