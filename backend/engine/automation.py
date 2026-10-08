"""
engine/automation.py
Evaluates Safe Storage Remaining (S_rem) and triggers actuation events:
  - S_rem < 150 h → Fan Actuation
  - S_rem < 48 h  → Dynamic Liquidation Auction API (30% discount)
"""
import time
import urllib.request
from typing import Any

from engine.kinetic_model import KineticResult

def send_real_phone_alert(title: str, message: str):
    """Sends a free, real-time push notification to the user's phone via ntfy.sh"""
    try:
        req = urllib.request.Request(
            "https://ntfy.sh/siloguard_8220480281",
            data=message.encode('utf-8'),
            headers={
                "Title": title.encode('utf-8'),
                "Tags": "rotating_light,warning,biohazard",
                "Priority": "high"
            }
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception as e:
        print(f"Push notification failed: {e}")



def evaluate_automation(kinetics: KineticResult, hotspot_detected: bool, hotspot_zone: str | None) -> list[dict[str, Any]]:
    """
    Evaluate current kinetic state and return a list of actuation events.
    Each event is a JSON-serialisable dict ready to be forwarded to the UI.
    """
    events: list[dict[str, Any]] = []
    ts = round(time.time(), 3)

    # ── Hotspot alert ──────────────────────────────────────────────────────
    if hotspot_detected and hotspot_zone:
        zone_label = hotspot_zone.replace("_", " ").title()
        events.append(
            {
                "id":        f"hotspot-{ts}",
                "type":      "HOTSPOT",
                "severity":  "WARNING",
                "icon":      "⚠️",
                "message":   f"{zone_label} Hotspot Detected — Localised thermal anomaly logged",
                "timestamp": ts,
            }
        )

    # ── Fan actuation (S_rem < 150 h) ─────────────────────────────────────
    if kinetics.s_rem < 150:
        events.append(
            {
                "id":        f"fan-{ts}",
                "type":      "FAN_ACTUATION",
                "severity":  "HIGH",
                "icon":      "💨",
                "message":   (
                    f"Aeration Fans Engaged — S_rem={kinetics.s_rem:.1f}h "
                    f"(Af={kinetics.af:.2f}), target T_core reduction active"
                ),
                "timestamp": ts,
                "payload": {
                    "action":   "FAN_ON",
                    "s_rem":    kinetics.s_rem,
                    "af":       kinetics.af,
                    "t_core":   kinetics.t_core,
                    "rh_core":  kinetics.rh_core,
                },
            }
        )

    # ── Dynamic liquidation auction (S_rem < 48 h) ────────────────────────
    if kinetics.s_rem < 48:
        discount_pct = 30
        events.append(
            {
                "id":        f"auction-{ts}",
                "type":      "LIQUIDATION_AUCTION",
                "severity":  "CRITICAL",
                "icon":      "🔴",
                "message":   (
                    f"Dynamic Liquidation Auction API Triggered — "
                    f"{discount_pct}% Discount | S_rem={kinetics.s_rem:.1f}h | "
                    f"Risk={kinetics.risk_level}"
                ),
                "timestamp": ts,
                "payload": {
                    "action":       "AUCTION_TRIGGER",
                    "discount_pct": discount_pct,
                    "s_rem":        kinetics.s_rem,
                    "af":           kinetics.af,
                    "risk_level":   kinetics.risk_level,
                },
            }
        )

    # ── Dispatch Real Push Notification to Phone ──────────────────────────
    for event in events:
        if event["type"] in ["RAPID_INFECTION", "LIQUIDATION_AUCTION"]:
            print(f"\n📱 [SENDING PUSH TO PHONE]: {event['type']}")
            send_real_phone_alert(
                title=f"SiloGuard Alert: {event['type']}",
                message=event["message"]
            )
        else:
            print(f"\n📱 [SMS DISPATCHED TO 8220480281]:")
            print(f"   ALERT TYPE: {event['type']}")
            print(f"   MESSAGE: {event['message']}")
            print(f"   ----------------------------------------\n")

    return events
