# SiloGuard

> Software-Defined Agritech Digital Twin for Post-Harvest Spoilage Prevention & Dynamic Liquidation

## Project Structure

```
siloguard/
├── backend/
│   ├── main.py                  # FastAPI app + WebSocket /ws/telemetry
│   ├── requirements.txt
│   └── engine/
│       ├── __init__.py
│       ├── telemetry.py         # 3D spatial silo grid + hotspot injection
│       ├── kinetic_model.py     # Fungal kinetic model (Af, S_rem)
│       └── automation.py        # Fan actuation & liquidation triggers
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx         # Main dashboard + WebSocket state
        │   └── globals.css
        └── components/
            ├── MetricsBar.tsx   # KPI cards (S_rem, temp, RH, CO2, Af)
            ├── Silo3DMap.tsx    # react-plotly.js 3D scatter heatmap
            └── AlertFeed.tsx    # Live scrolling event feed
```

## Prerequisites

- **Python 3.11+** with pip
- **Node.js 20+** with npm

## Quick Start

### 1. Backend

```powershell
cd siloguard\backend
pip install -r requirements.txt
python main.py
# Server starts at http://localhost:8000
# WebSocket at ws://localhost:8000/ws/telemetry
```

### 2. Frontend (new terminal)

```powershell
cd siloguard\frontend
npm install
npm run dev
# App available at http://localhost:3000
```

## Kinetic Model

| Formula | Description |
|---------|-------------|
| `Af = max(1.0, (T/20)^1.8 × (RH/60)^2.2 × (1 + (CO2−400)/1000))` | Fungal Acceleration Factor |
| `S_rem = 720 / Af` | Safe Storage Remaining (hours) |

## Automation Thresholds

| S_rem | Action |
|-------|--------|
| < 150 h | Fan Actuation engaged |
| < 48 h  | Dynamic Liquidation Auction API triggered (30% discount) |

## Risk Levels

| S_rem | Level | Colour |
|-------|-------|--------|
| ≥ 200 h | LOW | 🟢 Green |
| 150–200 h | MEDIUM | 🟡 Yellow |
| 48–150 h | HIGH | 🟠 Orange |
| < 48 h | CRITICAL | 🔴 Red |
