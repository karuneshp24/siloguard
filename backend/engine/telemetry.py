"""
engine/telemetry.py
Generates synthetic 3D spatial telemetry for a grain silo with three
depth zones and randomised thermal micro-hotspots.
"""
import math
import random
import time
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Silo spatial constants
# ---------------------------------------------------------------------------
GRID_X = 5          # number of columns
GRID_Y = 5          # number of rows
DEPTH_ZONES = {
    "surface":   3.0,
    "mid_level": 1.5,
    "deep_core": 0.2,
}

# Base environmental temperatures (°C) per zone
BASE_TEMPS = {
    "surface":   24.0,
    "mid_level": 27.0,
    "deep_core": 30.0,
}

# Base RH (%) and CO₂ (ppm)
BASE_RH_SURFACE   = 58.0
BASE_RH_MID       = 62.0
BASE_RH_CORE      = 70.0
BASE_CO2_PPM      = 420.0

# Hotspot injection probability per tick
HOTSPOT_PROB = 0.30


def _build_grid(tick: int) -> list[dict[str, Any]]:
    """
    Build a flat list of sensor-voxel readings for all (x, y, z) cells.
    Returns a list of dicts suitable for JSON serialisation.
    """
    rng = np.random.default_rng(seed=tick)
    voxels: list[dict[str, Any]] = []

    for zone_name, z_val in DEPTH_ZONES.items():
        base_t = BASE_TEMPS[zone_name]

        # Inject hotspot somewhere in this zone?
        hotspot = False
        hx = hy = -1
        if rng.random() < HOTSPOT_PROB:
            hotspot = True
            hx = int(rng.integers(0, GRID_X))
            hy = int(rng.integers(0, GRID_Y))

        for x in range(GRID_X):
            for y in range(GRID_Y):
                # Gaussian noise ± 1.2 °C
                temp = base_t + float(rng.normal(0.0, 1.2))

                if hotspot:
                    dist = math.sqrt((x - hx) ** 2 + (y - hy) ** 2)
                    # Hotspot peak up to +8 °C, decaying with distance
                    temp += max(0.0, 8.0 * math.exp(-0.6 * dist))

                # Clamp to realistic range
                temp = round(float(np.clip(temp, 15.0, 45.0)), 2)

                voxels.append(
                    {
                        "x": x,
                        "y": y,
                        "z": z_val,
                        "zone": zone_name,
                        "temperature": temp,
                        "hotspot": hotspot and (x == hx and y == hy),
                    }
                )

    return voxels


def _ambient_readings(tick: int) -> dict[str, float]:
    """Ambient RH and CO2 with small random drift."""
    rng = random.Random(tick * 17 + 3)
    return {
        "rh_surface":   round(BASE_RH_SURFACE + rng.uniform(-2.0, 2.0), 1),
        "rh_mid":       round(BASE_RH_MID + rng.uniform(-1.5, 2.5), 1),
        "rh_core":      round(BASE_RH_CORE + rng.uniform(-1.0, 3.5), 1),
        "co2_ppm":      round(BASE_CO2_PPM + rng.uniform(-10.0, 80.0), 1),
    }


def get_telemetry_snapshot(tick: int) -> dict[str, Any]:
    """
    Public API: returns one complete telemetry snapshot for the given tick.

    Returns:
        {
          "tick": int,
          "timestamp": float,
          "voxels": [...],
          "ambient": {...},
          "core": {temperature, rh, co2}
        }
    """
    voxels = _build_grid(tick)
    ambient = _ambient_readings(tick)

    # Aggregate core stats (deep-core zone average)
    deep_voxels = [v for v in voxels if v["zone"] == "deep_core"]
    t_core = round(float(np.mean([v["temperature"] for v in deep_voxels])), 2)

    has_hotspot = any(v["hotspot"] for v in voxels)
    hotspot_zone = next(
        (v["zone"] for v in voxels if v["hotspot"]), None
    )

    return {
        "tick":      tick,
        "timestamp": round(time.time(), 3),
        "voxels":    voxels,
        "ambient":   ambient,
        "core": {
            "temperature": t_core,
            "rh":          ambient["rh_core"],
            "co2_ppm":     ambient["co2_ppm"],
        },
        "hotspot_detected": has_hotspot,
        "hotspot_zone":     hotspot_zone,
    }
