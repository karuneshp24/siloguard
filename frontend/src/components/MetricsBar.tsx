"use client";

import { useMemo } from "react";
import { Thermometer, Droplets, Wind, Clock, Zap, FlaskConical, RefreshCw } from "lucide-react";
import type { TelemetryPayload } from "@/app/page";

interface MetricsBarProps { telemetry: TelemetryPayload | null; }
interface KpiCardProps {
  label: string; value: string; unit: string; subtext?: string;
  icon: React.ReactNode; colorClass: string; borderClass: string;
  bgClass: string; pulse?: boolean;
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function sRemColor(s: number) {
  if (s >= 200) return { colorClass: "text-emerald-400", borderClass: "border-emerald-500/40", bgClass: "bg-emerald-950/40", label: "Safe"      };
  if (s >= 150) return { colorClass: "text-yellow-400",  borderClass: "border-yellow-500/40",  bgClass: "bg-yellow-950/40",  label: "Monitor"   };
  if (s >=  48) return { colorClass: "text-orange-400",  borderClass: "border-orange-500/40",  bgClass: "bg-orange-950/40",  label: "High Risk" };
  return              { colorClass: "text-red-400",     borderClass: "border-red-500/40",     bgClass: "bg-red-950/40",     label: "Critical"  };
}
function tempColor(t: number) {
  if (t < 26) return { colorClass: "text-sky-400",    borderClass: "border-sky-500/40",    bgClass: "bg-sky-950/40"    };
  if (t < 30) return { colorClass: "text-yellow-400", borderClass: "border-yellow-500/40", bgClass: "bg-yellow-950/40" };
  if (t < 35) return { colorClass: "text-orange-400", borderClass: "border-orange-500/40", bgClass: "bg-orange-950/40" };
  return             { colorClass: "text-red-400",    borderClass: "border-red-500/40",    bgClass: "bg-red-950/40"    };
}
function rhColor(r: number) {
  if (r < 65) return { colorClass: "text-emerald-400", borderClass: "border-emerald-500/40", bgClass: "bg-emerald-950/40" };
  if (r < 72) return { colorClass: "text-yellow-400",  borderClass: "border-yellow-500/40",  bgClass: "bg-yellow-950/40"  };
  return             { colorClass: "text-red-400",     borderClass: "border-red-500/40",     bgClass: "bg-red-950/40"     };
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, subtext, icon, colorClass, borderClass, bgClass, pulse }: KpiCardProps) {
  return (
    <div className={`relative flex flex-col gap-1 px-3 py-2.5 sm:px-4 sm:py-3
                     rounded-xl border ${borderClass} ${bgClass}
                     min-w-[130px] sm:min-w-[150px] flex-shrink-0 sm:flex-1
                     select-none`}>
      {pulse && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400 animate-ping" />
      )}
      <div className="flex items-center gap-1.5 text-slate-500">
        <span className={colorClass}>{icon}</span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold truncate">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-xl sm:text-2xl font-bold tabular-nums leading-none ${colorClass}`}>
          {value}
        </span>
        <span className="text-[11px] text-slate-500 mb-0.5 leading-none shrink-0">{unit}</span>
      </div>
      {subtext && (
        <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
          {subtext}
        </span>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MetricsBar({ telemetry }: MetricsBarProps) {
  const cards = useMemo(() => {
    if (!telemetry) return null;
    const { kinetics, core, ambient } = telemetry;
    return {
      kinetics, core, ambient,
      sRem:  sRemColor(kinetics.s_rem),
      tCore: tempColor(core.temperature),
      rh:    rhColor(core.rh),
    };
  }, [telemetry]);

  if (!cards) {
    return (
      /* Skeleton — same scroll container */
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[...Array(6)].map((_, i) => (
          <div key={i}
            className="min-w-[130px] sm:min-w-[150px] flex-shrink-0 sm:flex-1
                       h-[76px] rounded-xl border border-slate-700/40
                       bg-slate-800/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const { kinetics, core, ambient, sRem, tCore, rh } = cards;

  return (
    /*
     * On mobile: horizontal scroll row (snap-x for smooth swipe)
     * On sm+:    wrapping flex row
     */
    <div className="flex gap-2 overflow-x-auto sm:overflow-x-visible
                    pb-1 sm:pb-0
                    snap-x snap-mandatory sm:snap-none
                    scrollbar-hide sm:flex-wrap">

      <KpiCard label="Safe Storage Remaining" value={kinetics.s_rem.toFixed(1)} unit="h"
        subtext={sRem.label} icon={<Clock className="w-3.5 h-3.5" />}
        colorClass={sRem.colorClass} borderClass={sRem.borderClass} bgClass={sRem.bgClass}
        pulse={kinetics.s_rem < 48} />

      <KpiCard label="Core Temperature" value={core.temperature.toFixed(1)} unit="°C"
        subtext={core.temperature >= 35 ? "Hotspot Risk" : core.temperature >= 30 ? "Elevated" : "Normal"}
        icon={<Thermometer className="w-3.5 h-3.5" />}
        colorClass={tCore.colorClass} borderClass={tCore.borderClass} bgClass={tCore.bgClass} />

      <KpiCard label="Core Humidity" value={core.rh.toFixed(1)} unit="% RH"
        subtext={core.rh >= 72 ? "Mold Risk" : core.rh >= 65 ? "Elevated" : "Optimal"}
        icon={<Droplets className="w-3.5 h-3.5" />}
        colorClass={rh.colorClass} borderClass={rh.borderClass} bgClass={rh.bgClass} />

      <KpiCard label="CO₂ Level" value={core.co2_ppm.toFixed(0)} unit="ppm"
        subtext={core.co2_ppm > 1000 ? "High Respiration" : "Normal"}
        icon={<Wind className="w-3.5 h-3.5" />}
        colorClass={core.co2_ppm > 800 ? "text-orange-400" : "text-sky-400"}
        borderClass={core.co2_ppm > 800 ? "border-orange-500/40" : "border-sky-500/40"}
        bgClass={core.co2_ppm > 800 ? "bg-orange-950/40" : "bg-sky-950/40"} />

      <KpiCard label="Fungal Accel. Factor" value={kinetics.af.toFixed(3)} unit="Af"
        subtext={kinetics.af > 3 ? "Rapid Growth" : kinetics.af > 2 ? "Accelerated" : "Baseline"}
        icon={<FlaskConical className="w-3.5 h-3.5" />}
        colorClass={kinetics.af > 3 ? "text-red-400" : kinetics.af > 2 ? "text-orange-400" : "text-emerald-400"}
        borderClass={kinetics.af > 3 ? "border-red-500/40" : kinetics.af > 2 ? "border-orange-500/40" : "border-emerald-500/40"}
        bgClass={kinetics.af > 3 ? "bg-red-950/40" : kinetics.af > 2 ? "bg-orange-950/40" : "bg-emerald-950/40"}
        pulse={kinetics.af > 3} />

      <KpiCard label="Surface Humidity" value={ambient.rh_surface.toFixed(1)} unit="% RH"
        subtext="Surface zone"
        icon={<Zap className="w-3.5 h-3.5" />}
        colorClass="text-violet-400" borderClass="border-violet-500/40" bgClass="bg-violet-950/40" />

      <KpiCard label="Nutrient Recovery" value="58%" unit="Value"
        subtext="Biofuel & Feed Loop"
        icon={<RefreshCw className="w-3.5 h-3.5" />}
        colorClass="text-emerald-400" borderClass="border-emerald-500/50" bgClass="bg-emerald-950/50" />
    </div>
  );
}
