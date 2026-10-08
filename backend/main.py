"""
main.py — SiloGuard FastAPI backend
WebSocket endpoint /ws/telemetry streams a combined payload at 1 Hz.
"""
import asyncio
import json
import logging
from dataclasses import asdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from engine.automation import evaluate_automation
from engine.kinetic_model import compute_kinetics
from engine.telemetry import get_telemetry_snapshot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("siloguard")

app = FastAPI(title="SiloGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "SiloGuard"}


# ── WebSocket telemetry stream ────────────────────────────────────────────────
@app.websocket("/ws/telemetry")
async def telemetry_stream(ws: WebSocket):
    await ws.accept()
    logger.info("Client connected: %s", ws.client)
    tick = 0

    try:
        while True:
            # 1. Gather telemetry snapshot
            snapshot = get_telemetry_snapshot(tick)

            # 2. Compute kinetic model
            core    = snapshot["core"]
            kinetics = compute_kinetics(
                t_core  = core["temperature"],
                rh_core = core["rh"],
                co2_ppm = core["co2_ppm"],
            )

            # 3. Run automation checks
            events = evaluate_automation(
                kinetics         = kinetics,
                hotspot_detected = snapshot["hotspot_detected"],
                hotspot_zone     = snapshot["hotspot_zone"],
            )

            # 4. Build combined payload
            payload = {
                "tick":      snapshot["tick"],
                "timestamp": snapshot["timestamp"],
                "voxels":    snapshot["voxels"],
                "ambient":   snapshot["ambient"],
                "core":      snapshot["core"],
                "hotspot_detected": snapshot["hotspot_detected"],
                "hotspot_zone":     snapshot["hotspot_zone"],
                "kinetics":  asdict(kinetics),
                "events":    events,
            }

            await ws.send_text(json.dumps(payload))
            logger.debug("Tick %d sent | S_rem=%.1fh | Af=%.3f", tick, kinetics.s_rem, kinetics.af)

            tick += 1
            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        logger.info("Client disconnected: %s", ws.client)
    except Exception as exc:
        logger.error("Stream error: %s", exc)
        await ws.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
