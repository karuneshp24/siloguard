/**
 * simulator.ts
 * Pure client-side telemetry simulator — mirrors the Python backend logic.
 * Used as fallback when WebSocket to localhost:8000 is unavailable.
 */
import type { TelemetryPayload, Voxel, Ambient, Core, Kinetics, AlertEvent } from "@/app/page";

const GRID = 5;
const ZONES = [
  { name: "surface",   z: 3.0, baseT: 24.0, baseRH: 58.0 },
  { name: "mid_level", z: 1.5, baseT: 27.0, baseRH: 62.0 },
  { name: "deep_core", z: 0.2, baseT: 30.0, baseRH: 70.0 },
];
const BASE_CO2 = 420;

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function normal(r: () => number, mean = 0, std = 1): number {
  // Box-Muller transform
  const u = 1 - r();
  const v = r();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function simulateTick(tick: number): TelemetryPayload {
  const r = seededRand(tick * 6364136223846793005 + 1442695040888963407);
  const now = Date.now() / 1000;

  const voxels: Voxel[] = [];
  let hotspotDetected = false;
  let hotspotZone: string | null = null;

  for (const zone of ZONES) {
    const hasHotspot = r() < 0.30;
    const hx = Math.floor(r() * GRID);
    const hy = Math.floor(r() * GRID);

    if (hasHotspot) { hotspotDetected = true; hotspotZone = zone.name; }

    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        let temp = zone.baseT + normal(r, 0, 1.2);
        if (hasHotspot) {
          const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
          temp += Math.max(0, 8 * Math.exp(-0.6 * dist));
        }
        temp = Math.min(45, Math.max(15, temp));
        voxels.push({
          x, y, z: zone.z, zone: zone.name,
          temperature: Math.round(temp * 100) / 100,
          hotspot: hasHotspot && x === hx && y === hy,
        });
      }
    }
  }

  const ambient: Ambient = {
    rh_surface: Math.round((58 + normal(r, 0, 2)) * 10) / 10,
    rh_mid:     Math.round((62 + normal(r, 0, 2)) * 10) / 10,
    rh_core:    Math.round((70 + normal(r, 0, 2)) * 10) / 10,
    co2_ppm:    Math.round(BASE_CO2 + r() * 80 - 10),
  };

  const deepVoxels = voxels.filter(v => v.zone === "deep_core");
  const tCore = Math.round(
    (deepVoxels.reduce((s, v) => s + v.temperature, 0) / deepVoxels.length) * 100
  ) / 100;

  const core: Core = { temperature: tCore, rh: ambient.rh_core, co2_ppm: ambient.co2_ppm };

  // Kinetic model
  const af = Math.max(
    1.0,
    Math.pow(tCore / 20, 1.8) * Math.pow(ambient.rh_core / 60, 2.2) *
    (1 + (ambient.co2_ppm - 400) / 1000)
  );
  const sRem = 720 / af;
  const riskLevel: Kinetics["risk_level"] =
    sRem >= 200 ? "LOW" : sRem >= 150 ? "MEDIUM" : sRem >= 48 ? "HIGH" : "CRITICAL";

  const kinetics: Kinetics = {
    af: Math.round(af * 10000) / 10000,
    s_rem: Math.round(sRem * 100) / 100,
    t_core: tCore, rh_core: ambient.rh_core, co2_ppm: ambient.co2_ppm,
    risk_level: riskLevel,
  };

  const events: AlertEvent[] = [];
  if (hotspotDetected && hotspotZone) {
    events.push({
      id: `hotspot-${tick}`,
      type: "HOTSPOT", severity: "WARNING", icon: "⚠️",
      message: `${hotspotZone.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Hotspot Detected — Localised thermal anomaly`,
      timestamp: now,
    });
  }
  if (sRem < 150) {
    events.push({
      id: `fan-${tick}`,
      type: "FAN_ACTUATION", severity: "HIGH", icon: "💨",
      message: `Aeration Fans Engaged — S_rem=${sRem.toFixed(1)}h (Af=${af.toFixed(2)})`,
      timestamp: now,
    });
  }
  if (sRem < 48) {
    events.push({
      id: `auction-${tick}`,
      type: "LIQUIDATION_AUCTION", severity: "CRITICAL", icon: "🔴",
      message: `Dynamic Liquidation Auction Triggered — 30% Discount | S_rem=${sRem.toFixed(1)}h`,
      timestamp: now,
    });
  }

  return { tick, timestamp: now, voxels, ambient, core, hotspot_detected: hotspotDetected, hotspot_zone: hotspotZone, kinetics, events };
}
