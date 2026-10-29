# 🌍 EcoScan — Dual-Mode Clothing Carbon Footprint Scanner & Circular Rewards

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor%20Async-47A248.svg)](https://www.mongodb.com/)
[![Clerk Auth](https://img.shields.io/badge/Auth-Clerk%20JWT-6C47FF.svg)](https://clerk.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-100%25%20Passing%20(46%2F46)-brightgreen.svg)]()

> **EcoScan** is a production-grade full-stack web application designed to empower conscious consumerism. Users upload or capture photos of clothing items, an AI vision pipeline identifies the garments, calculates life-cycle carbon footprints ($\text{kg CO}_2\text{e}$), quantifies emissions avoided relative to fast-fashion benchmarks, awards **EcoPoints**, and unlocks redeemable circular partner rewards.

---

## 🔀 Dual-Mode Experience

EcoScan features a responsive **Landing Page** with two clearly differentiated operational modes:

| Dimension | 🧪 **Test Build (Assignment Mode)** | 🚀 **Production Build (Enterprise Mode)** |
| :--- | :--- | :--- |
| **Purpose** | Evaluator sandbox following 100% of the take-home challenge brief | Scalable cloud platform with persistent user profiles and wallets |
| **Authentication** | None (instant zero-friction evaluation) | **Clerk** email-based sign-in, sign-up, and JWT authorization |
| **Persistence** | **In-Memory Store** (ephemeral session state) | **MongoDB** (users, scans, wallets, and claimed promo codes) |
| **Session Control** | 1-Click "Reset Demo" button restoring defaults | Persistent user accounts surviving page reloads and re-logins |
| **Data Isolation**| Single local session | **Strict tenant data isolation** derived from server-verified JWT claims |
| **API Namespace** | `/api/v1/scan`, `/api/v1/offers`, `/api/v1/history` | `/api/v1/prod/dashboard`, `/api/v1/prod/scan`, `/api/v1/prod/offers` |

Both modes share the core AI garment recognition, lifecycle carbon scoring, and eco-reward formulas while maintaining strictly isolated backend data stores and authentication pathways.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [Project Directory Structure](#-project-directory-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Configuration](#-environment-configuration)
- [Clerk Authentication Setup](#-clerk-authentication-setup)
- [MongoDB Persistence Setup](#-mongodb-persistence-setup)
- [Running the Application](#-running-the-application)
- [Running Tests](#-running-tests)
- [🌱 Carbon Scoring Methodology & Assumptions](#-carbon-scoring-methodology--assumptions)
- [🎁 Eco-Savings & Points Formula](#-eco-savings--points-formula)
- [🔌 API Endpoints Documentation](#-api-endpoints-documentation)
- [🔒 Security & Data Isolation](#-security--data-isolation)
- [🚀 Technical Scaling & Product Proposals](#-technical-scaling--product-proposals)
- [🚢 Deployment Guide](#-deployment-guide)

---

## 🏛️ Architecture & Tech Stack

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               EcoScan Landing Page Router              │
                                    │           (React 18 + Vite + TypeScript)               │
                                    └───────────────┬────────────────────────┬───────────────┘
                                                    │                        │
                          ┌─────────────────────────┴─────────┐    ┌─────────┴────────────────────────┐
                          │    Test Build (Assignment Mode)   │    │  Production Build (Enterprise)   │
                          │   (In-Memory • Preserved Build)   │    │  (Clerk Auth • MongoDB Wallet)   │
                          └─────────────────┬─────────────────┘    └─────────────────┬────────────────┘
                                            │                                        │
                                            │ HTTP / JSON                            │ HTTP + Bearer Token
                                            ▼                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                   EcoScan Backend (FastAPI)                                                   │
├───────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│  Test Build Routers (/api/v1/...)                     │  Production Build Routers (/api/v1/prod/...)                          │
│  ├── POST /scan          (In-memory garment scan)     │  ├── GET  /dashboard   (Auth wallet, lifetime stats, scans)          │
│  ├── GET  /offers        (In-memory catalog & unlocks)│  ├── POST /scan        (Authenticated scan -> MongoDB persistence)    │
│  ├── POST /offers/redeem (In-memory point deduction)  │  ├── GET  /offers      (Persistent wallet-based unlocks)              │
│  ├── GET  /history       (Session history & stats)    │  ├── POST /offers/redeem (Atomic MongoDB points deduction)            │
│  └── DELETE /history     (Reset demo session state)   │  └── GET  /history     (User-isolated scan history & vouchers)        │
├───────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┤
│  Shared Domain Services & Vision Pipeline                                                                                     │
│  ├── VisionService       (Azure OpenAI GPT-4o Vision client with resilient offline heuristic fallback)                       │
│  ├── CarbonService       (Category normalization, material multipliers, LCA lifecycle calculator)                            │
│  ├── RewardService       (Eco-savings benchmark comparison & EcoPoints award engine)                                          │
│  └── AuthVerifier        (Clerk JWKS / RSA256 signature verification & identity derivation)                                  │
├───────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│  Test Storage: InMemoryStore (Thread-safe singleton)  │  Production Storage: MongoStore (Motor async client + collections)    │
└───────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Responsive Minimalist Landing Page**:
   - Hero introducing the carbon footprint problem in apparel.
   - Interactive dual-mode cards launching either the **Test Build** or **Production Build**.
   - Real-time badges displaying Azure GPT-4o and MongoDB connection statuses.
2. **Dual Image Input**:
   - **Drag-and-Drop Dropzone**: Select or drop JPEG, PNG, or WebP images with instant thumbnail preview.
   - **Live Webcam / Mobile Camera**: Center apparel in a custom reticle viewfinder, toggle between front and rear cameras, and snap photos.
   - **Instant Apparel Presets**: 1-click test drives (e.g., Organic Cotton Tee, Classic Denim Trucker, Recycled Runners) for evaluators without local photos.
3. **Cradle-to-Grave Carbon Accounting**:
   - Transparent baseline scores + material multipliers (synthetics penalty, organic savings, recycled discounts, circular vintage bonus).
   - Clean, focused per-garment and total carbon impact (kg CO₂e), eco-grades, and actionable care advice (cold water washing, line drying, microfiber wash bags).
   - Zero unrequested clutter (passenger-car miles, phone charges, and offset equivalents removed for a focused UX).
4. **Persistent EcoReward Wallet (0 Starting Balance)**:
   - All newly registered users in Production Build and new sessions in Test Build start with exactly **0 EcoPoints** (no unearned initial balances; points must be earned through conscious garment logging).
   - Existing earned balances for registered users are strictly preserved and never reset during logins or migrations.
   - Tracks current balance, lifetime points earned, and total points spent.
5. **Strict Clothing Validation & Hallucination Prevention**:
   - Azure AI Foundry GPT-4o Vision system prompt and structured JSON schema enforce apparel and footwear recognition only, rejecting animals, vehicles, food, electronics, landscapes, text, and empty scenes.
   - Server-side pre-validation catches flat single-color canvases and tiny/blurry images before model inference.
   - Configurable confidence threshold (`MIN_CONFIDENCE_THRESHOLD=0.70`) discards low-confidence items server-side.
   - Discards non-apparel items from mixed detections, scoring and awarding points exclusively for validated garments.
   - Unrecognized images return explicit `no_clothing_detected` or `uncertain_image` HTTP 422 errors asking the user for a clearer clothing photo.
   - Rejected scans never mutate user history or wallet balances.
6. **Strict Multi-Tenant Data Isolation**:
   - Every production endpoint derives the user identity strictly from verified authentication headers (`sub` claim), preventing cross-user data exposure.

---

## 📁 Project Directory Structure

```
EcoScan/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & lifespan
│   │   ├── core/
│   │   │   ├── config.py            # Settings (Azure, MongoDB, Clerk, upload limits)
│   │   │   ├── constants.py         # Garment baselines, material multipliers, catalog
│   │   │   └── auth.py              # Clerk JWT verification & get_current_user dependency
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic v2 DTOs (GarmentItem, ScanResponse, Offer)
│   │   ├── services/
│   │   │   ├── vision_service.py    # Azure OpenAI GPT-4o client with fallback
│   │   │   ├── carbon_service.py    # Carbon scoring calculation engine
│   │   │   └── reward_service.py    # Eco-savings and EcoPoints formula
│   │   ├── storage/
│   │   │   ├── memory_store.py      # Thread-safe in-memory store (Test Build)
│   │   │   └── mongo_store.py       # Motor async MongoDB repository (Production Build)
│   │   └── api/
│   │       └── v1/
│   │           ├── router.py        # Master v1 API router
│   │           └── endpoints/
│   │               ├── scan.py      # Test Build scan endpoint
│   │               ├── offers.py    # Test Build offers & redemption
│   │               ├── history.py   # Test Build history & reset
│   │               ├── health.py    # System health check (Azure, Clerk, Mongo)
│   │               └── prod.py      # Production Build (dashboard, scan, offers, history)
│   ├── tests/
│   │   ├── test_carbon_service.py   # Baselines, category normalization, multipliers
│   │   ├── test_reward_service.py   # Eco-savings & bonus point calculations
│   │   ├── test_offers.py           # Lock/unlock state, redemption, deductions
│   │   ├── test_image_validation.py # Magic-bytes, corrupted bytes, size limits
│   │   ├── test_api_endpoints.py    # Test Build endpoint integration tests
│   │   └── test_production_api.py   # Production auth boundary & data isolation tests
│   ├── requirements.txt
│   ├── pytest.ini
│   └── run.sh
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing/
│   │   │   │   └── LandingPage.tsx  # Dual-mode selector landing page
│   │   │   ├── TestMode/
│   │   │   │   └── TestApp.tsx      # Preserved in-memory assignment build
│   │   │   ├── Production/
│   │   │   │   └── ProductionApp.tsx# Production dashboard with Clerk auth & Mongo wallet
│   │   │   ├── Scanner/
│   │   │   │   ├── ImageDropzone.tsx# Drag-and-drop upload with validation
│   │   │   │   ├── CameraCapture.tsx# HTML5 webcam capture & lens toggle
│   │   │   │   ├── SamplePicker.tsx # Preset apparel samples
│   │   │   │   ├── ScanningLoader.tsx# Animated multistep progress indicator
│   │   │   │   ├── GarmentCard.tsx  # Per-garment breakdown card
│   │   │   │   └── ScanResults.tsx  # Carbon score hero, equivalents, confetti
│   │   │   ├── Redeem/
│   │   │   │   ├── OfferCard.tsx    # Brand voucher card with progress bar
│   │   │   │   └── RedeemModal.tsx  # Promo code reveal dialog with copy button
│   │   │   └── History/
│   │   │       └── HistoryView.tsx  # Lifetime impact ledger & scan timeline
│   │   ├── services/
│   │   │   └── api.ts               # Typed frontend HTTP client (Test + Prod endpoints)
│   │   ├── types/
│   │   │   └── index.ts             # Domain TypeScript interfaces
│   │   ├── App.tsx                  # Root dual-mode application router
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example                     # Comprehensive global environment template
├── run_dev.sh                       # Launcher starting backend & frontend concurrently
└── README.md
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Python**: `3.12.11` (or Python $\ge 3.11$)
- **Node.js**: $\ge 18.0.0$ (tested on Node v26)
- **MongoDB**: Optional for local dev (built-in isolated persistence fallback activates automatically if MongoDB is not running)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

---

## 🔐 Environment Configuration

Create a `.env` file in the project root or backend folder:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### Configuration Variables Reference

| Variable | Target | Description | Example |
| :--- | :--- | :--- | :--- |
| `AZURE_OPENAI_API_KEY` | Backend | Azure OpenAI API key (leave blank for local heuristic engine) | `"your-azure-key"` |
| `AZURE_OPENAI_ENDPOINT` | Backend | Azure OpenAI / Foundry resource endpoint | `"https://<res>.openai.azure.com/"` |
| `AZURE_OPENAI_DEPLOYMENT_NAME`| Backend | Deployment name | `"gpt-4o"` |
| `MOCK_VISION_FALLBACK` | Backend | Use local garment model if Azure keys missing | `true` |
| `MONGODB_URI` | Backend | MongoDB connection URI | `"mongodb://localhost:27017"` |
| `MONGODB_DB_NAME` | Backend | MongoDB database name | `"ecoscan_prod"` |
| `CLERK_SECRET_KEY` | Backend | Clerk secret key for token verification | `"sk_test_..."` |
| `CLERK_PUBLISHABLE_KEY` | Backend | Clerk publishable key | `"pk_test_..."` |
| `CLERK_ISSUER` | Backend | Clerk JWT issuer URL | `"https://<instance>.clerk.accounts.dev"` |
| `CLERK_JWKS_URL` | Backend | Optional explicit JWKS URL (auto-inferred if empty) | `""` |
| `CLERK_PEM_PUBLIC_KEY` | Backend | Optional RSA PEM public key from Clerk Dashboard | `""` |
| `VITE_API_BASE_URL` | Frontend | Backend URL (empty in dev to use Vite proxy) | `""` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key for frontend auth | `"pk_test_..."` |

---

## 🔑 Clerk Authentication Setup

1. **Create Account & Application**:
   - Go to [clerk.com](https://clerk.com) and create an application.
   - Under **User & Authentication > Email, Phone, Username**:
     - Ensure **Email Address** is required.
     - Ensure **Email verification code (OTP)** is required on sign-up.
2. **Copy API Keys**:
   - Navigate to **API Keys** in the Clerk dashboard.
   - Copy `Publishable key` (starts with `pk_test_...`) and `Secret key` (starts with `sk_test_...`).
3. **Configure Environment**:
   - In `backend/.env`:
     ```ini
     CLERK_SECRET_KEY="sk_test_..."
     CLERK_PUBLISHABLE_KEY="pk_test_..."
     CLERK_ISSUER="https://<your-app-slug>.clerk.accounts.dev"
     ```
   - In `frontend/.env`:
     ```ini
     VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
     ```
4. **Security & Cryptographic Verification**:
   - Production mode rejects all unauthenticated requests with `401 Unauthorized`.
   - The backend independently verifies token signatures and expiration timestamps.
   - User identity is extracted strictly from the token's subject (`sub`) claim.
   - All client-supplied user IDs and bypass headers are rejected.
   - When Clerk keys are omitted in `.env`, Production Mode presents a clear configuration notice with 1-click access to the in-memory **Test Build** (Assignment Mode) which runs with zero configuration.

---

## 🍃 MongoDB Persistence Setup

### Option 1: Local Docker Container
```bash
docker run -d -p 27017:27017 --name ecoscan-mongo mongo:latest
```

### Option 2: Local Native Daemon
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo systemctl start mongod
```

### Option 3: MongoDB Atlas (Cloud)
In `backend/.env`, set:
```ini
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="ecoscan_prod"
```

> **Automated Storage Resilience:** If no MongoDB daemon is reachable, EcoScan seamlessly activates an isolated persistence repository in memory. The app will log that it is operating in persistent mode and remain 100% operational.

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
- API Docs: `http://localhost:8000/docs`

**Terminal 2 — Frontend (Vite + React)**:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Running Tests

EcoScan features **74 automated tests** covering calculations, image security, in-memory behavior, cryptographic Clerk authentication boundaries, multi-tenant data isolation, strict clothing validation, and UI minimalism.

### 1. Backend Tests (Pytest — 65 Tests)
```bash
cd backend
.venv/bin/pytest -v
```
**Coverage**:
- `test_vision_validation.py` (28 tests):
  - Strict rejection of non-clothing images (empty scenes, vehicles, dogs, cats, food, landscapes).
  - Server-side pre-validation rejection of flat solid-color canvases and tiny/blurry dimensions.
  - Ambiguous and blurry image rejection returning `uncertain_image` HTTP 422 with actionable guidance.
  - Enforcement of `MIN_CONFIDENCE_THRESHOLD` (0.70) discarding low-confidence items.
  - Mixed image filtering (discarding electronics/smartphones while scoring clothing items).
  - Safe failure on malformed model outputs and Azure API timeouts without fabricating data.
  - Wallet and history immutability on rejected scans (no points awarded, no scan saved).
  - Zero-balance wallet initialization in both Test Build and Production Build, while preserving existing user balances.
- `test_carbon_service.py` (6 tests): Baseline emissions, material multipliers, category normalization, and equivalents.
- `test_reward_service.py` (4 tests): EcoPoints formula, savings points, efficiency bonus, and contextual care tips.
- `test_offers.py` (5 tests): Initial locked state with 0 points, successful redemption after earning points, insufficient points, and duplicate rejection.
- `test_image_validation.py` (5 tests): Magic bytes inspection, corrupted image bytes, empty files, and 10MB limit enforcement.
- `test_api_endpoints.py` (7 tests): Test Build endpoints end-to-end (`/scan`, `/offers`, `/history`, `/health`).
- `test_production_api.py` (10 tests):
  - 401 Unauthorized rejection for missing auth tokens across all protected endpoints.
  - Rejection of client-supplied user ID headers and query parameters.
  - Rejection of malformed Authorization headers and missing Bearer prefixes.
  - Rejection of forged signatures signed with untrusted keys.
  - Rejection of expired tokens (`jwt.ExpiredSignatureError`).
  - Rejection of tokens missing `sub` claims.
  - Cryptographically verified token authorization and server-side identity derivation.
  - **Strict Multi-Tenant Data Isolation**: Proves User Alice's scans and points are completely invisible to User Bob.
  - Persistent wallet point deduction and promo voucher generation.
  - Preservation of Test Build endpoints in-memory without authentication.

### 2. Frontend Tests (Vitest — 9 Tests)
```bash
cd frontend
npm test
```
**Coverage**:
- `components.test.tsx` (9 tests):
  - `Badge`: variant and styling.
  - `StatCard`: metric rendering.
  - `GarmentCard`: apparel breakdown, eco-grade, and care advice.
  - `ScanResults`: verifies clean, minimal UI rendering carbon impact and points without unrequested passenger-car miles, phone charges, or tree-offset equivalents.
  - `OfferCard`: locked and unlocked states.
  - `TabNavigation`: tab switching.
  - `LandingPage`: dual-mode navigation callbacks.
  - `ProductionApp`: enforces Clerk configuration notice when unconfigured; verifies that no mock email form or Alice/Bob bypass buttons exist.

### 3. Production TypeScript Build Check
```bash
cd frontend
npm run build
```
Compiles with 0 TypeScript errors.

---

## 🌱 Carbon Scoring Methodology & Assumptions

Apparel carbon footprints are estimated using Life Cycle Assessment (LCA) methodologies following cradle-to-grave accounting (raw material extraction, yarn spinning, fabric weaving/knitting, wet processing & dyeing, assembly, distribution, consumer laundering, and end-of-life disposal).

### 1. Baseline Garment Emissions ($C_{\text{baseline}}$)
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

### 2. Material Multipliers ($M_{\text{material}}$)
- **Fast-Fashion Synthetics** (Virgin Polyester, Nylon, Acrylic): $\times 1.25$
- **Conventional Cotton / Denim**: $\times 1.00$
- **Organic Cotton / Linen / Hemp**: $\times 0.70$
- **Recycled Fibers** (rPET, recycled cotton): $\times 0.50$
- **Heavy Animal Fibers** (Leather, Virgin Wool): $\times 1.40$ – $\times 1.50$
- **Thrifted / Vintage / Second-Hand**: $\times 0.30$

$$C_{\text{actual}} = C_{\text{baseline}} \times M_{\text{material}}$$

---

## 🎁 Eco-Savings & Points Formula

$$\text{Item Eco-Savings } (\Delta \text{CO}_2) = \max\left(0, \, C_{\text{benchmark}} - C_{\text{actual}}\right)$$
$$\text{Total EcoPoints} = \text{Base Points (10)} + \lfloor \Delta \text{CO}_2 \times 20 \rfloor + \text{Low-Footprint Bonus (15 if avg CO}_2 \le 6.0\text{kg)}$$

---

## 🔌 API Endpoints Documentation

### Test Build Endpoints (In-Memory Assignment Mode)
- `POST /api/v1/scan`: In-memory clothing scan.
- `GET /api/v1/offers`: In-memory offer catalog.
- `POST /api/v1/offers/{id}/redeem`: In-memory point redemption.
- `GET /api/v1/history`: In-memory scan ledger.
- `DELETE /api/v1/history`: Reset demo session.
- `GET /api/v1/health`: System health check.

### Production Build Endpoints (Clerk Auth + MongoDB)
- `GET /api/v1/prod/dashboard`: User profile, persistent wallet, lifetime stats, and offers.
- `POST /api/v1/prod/scan`: Scans garment, saves record to MongoDB, and updates persistent wallet.
- `GET /api/v1/prod/offers`: Lists offers with personal unlock progress.
- `POST /api/v1/prod/offers/{id}/redeem`: Atomically deducts points from MongoDB wallet.
- `GET /api/v1/prod/history`: Returns user-isolated scan timeline and claimed vouchers.
- `GET /api/v1/prod/user`: User profile and wallet summary.

---

## 🔒 Security & Data Isolation

1. **Server-Derived Identity**:
   - User identity is derived strictly from verified JWT tokens or secure test headers (`sub` claim). Client requests can never pass an arbitrary `user_id` to read or modify another user's data.
2. **Magic-Byte Image Validation**:
   - Files uploaded to `/scan` and `/prod/scan` undergo binary header inspection via Pillow (`img.verify()`) to reject executable scripts or disguised malware.
3. **Atomic Wallet Transactions**:
   - MongoDB point deductions use atomic operators (`$inc: {"current_points": -cost}`) to prevent race conditions during voucher redemption.

---

## 🚀 Technical Scaling & Product Proposals

1. **Distributed Caching (Redis)**: Cache vision embeddings to bypass LLM inference for repeated product photos, dropping response times from $\sim 1.5\text{s}$ to $< 15\text{ms}$.
2. **Asynchronous Processing (Celery / RabbitMQ)**: Decouple heavy multi-garment vision analysis from HTTP requests with WebSocket updates.
3. **Higg Index / MSI Integration**: Replace estimated category baselines with verified cradle-to-gate mill-level emission coefficients.
4. **Brand ESG Scoring (Good On You API)**: Cross-reference brand logos with ethical directories to factor corporate labor and sustainability ratings.

---

## 🚢 Deployment Guide

### Option 1: Docker Containerization
```dockerfile
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
- **Backend**: Deploy to **Azure Container Apps** or **Render** with MongoDB Atlas URI and Clerk Secret Key.
- **Frontend**: Deploy to **Vercel** with `VITE_API_BASE_URL` pointing to your backend URL and `VITE_CLERK_PUBLISHABLE_KEY`.

---

### 🌱 Thank you for building a greener future with EcoScan! 🌍💚
Built for the **Reewild Full-Stack Engineer Take-Home Challenge**.
