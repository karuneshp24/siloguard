"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import type { Voxel } from "@/app/page";

interface Silo3DMapProps { voxels: Voxel[]; }

// ── WebGL detection ────────────────────────────────────────────────────────
function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch { return false; }
}

// ── YlOrRd colour scale (matches Plotly) ──────────────────────────────────
const YLORD_STOPS = [
  [0.00, [255, 255, 204]],
  [0.25, [254, 217,  85]],
  [0.50, [253, 141,  60]],
  [0.75, [240,  59,  32]],
  [1.00, [189,   0,  38]],
] as [number, number[]][];

function tempToColor(t: number, min = 15, max = 45): string {
  const ratio = Math.max(0, Math.min(1, (t - min) / (max - min)));
  let lo = YLORD_STOPS[0], hi = YLORD_STOPS[YLORD_STOPS.length - 1];
  for (let i = 0; i < YLORD_STOPS.length - 1; i++) {
    if (ratio >= YLORD_STOPS[i][0] && ratio <= YLORD_STOPS[i + 1][0]) {
      lo = YLORD_STOPS[i]; hi = YLORD_STOPS[i + 1]; break;
    }
  }
  const t2 = (ratio - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round((lo[1] as number[])[0] + ((hi[1] as number[])[0] - (lo[1] as number[])[0]) * t2);
  const g = Math.round((lo[1] as number[])[1] + ((hi[1] as number[])[1] - (lo[1] as number[])[1]) * t2);
  const b = Math.round((lo[1] as number[])[2] + ((hi[1] as number[])[2] - (lo[1] as number[])[2]) * t2);
  return `rgb(${r},${g},${b})`;
}

// ── 2D Canvas fallback heatmap ─────────────────────────────────────────────
const ZONE_LABELS: Record<string, string> = {
  surface:   "Surface (3.0m)",
  mid_level: "Mid-Level (1.5m)",
  deep_core: "Deep Core (0.2m)",
};

function Canvas2DHeatmap({ voxels }: { voxels: Voxel[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !voxels.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, W, H);

    const zones = ["deep_core", "mid_level", "surface"] as const;
    const GRID = 5;
    const pad = 40;
    const labelH = 18;
    const zoneH = (H - pad - zones.length * labelH) / zones.length;
    const cellW = (W - pad * 2) / GRID;
    const cellH = (zoneH - 8) / GRID;

    zones.forEach((zone, zi) => {
      const zoneVoxels = voxels.filter(v => v.zone === zone);
      const yBase = pad + zi * (zoneH + labelH);

      // Zone label
      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.max(9, Math.min(11, cellH * 0.35))}px monospace`;
      ctx.fillText(ZONE_LABELS[zone], pad, yBase - 4);

      for (let x = 0; x < GRID; x++) {
        for (let y = 0; y < GRID; y++) {
          const v = zoneVoxels.find(v => v.x === x && v.y === y);
          if (!v) continue;
          const cx = pad + x * cellW;
          const cy = yBase + y * cellH;
          const cw = cellW - 2;
          const ch = cellH - 2;

          // Cell fill
          ctx.fillStyle = tempToColor(v.temperature);
          ctx.beginPath();
          ctx.roundRect(cx, cy, cw, ch, 3);
          ctx.fill();

          // Hotspot ring
          if (v.hotspot) {
            ctx.strokeStyle = "#ff4444";
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
          }

          // Temperature label inside cell
          if (cw > 28 && ch > 14) {
            ctx.fillStyle = v.temperature > 32 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.6)";
            ctx.font = `bold ${Math.max(8, Math.min(10, ch * 0.45))}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${v.temperature.toFixed(0)}°`, cx + cw / 2, cy + ch / 2);
          }
        }
      }
    });

    // Colour-bar
    const barX = W - 16, barY = pad, barH = H - pad * 1.5;
    const grad = ctx.createLinearGradient(0, barY + barH, 0, barY);
    YLORD_STOPS.forEach(([stop, [r, g, b]]) => {
      grad.addColorStop(stop, `rgb(${r},${g},${b})`);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, 10, barH);
    ctx.fillStyle = "#64748b";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("45°", barX + 12, barY);
    ctx.textBaseline = "bottom";
    ctx.fillText("15°", barX + 12, barY + barH);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }, [voxels]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", touchAction: "pan-x pan-y" }}
      aria-label="2D silo heatmap grid"
    />
  );
}

// ── 3D Plotly map (WebGL) ─────────────────────────────────────────────────
type PlotlyComponent = React.ComponentType<{
  data: object[];
  layout: object;
  config?: object;
  style?: React.CSSProperties;
  useResizeHandler?: boolean;
}>;

function Plotly3DMap({ voxels }: { voxels: Voxel[] }) {
  const [Plot, setPlot] = useState<PlotlyComponent | null>(null);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    import("react-plotly.js")
      .then(m => setPlot(() => m.default as PlotlyComponent))
      .catch(() => setFailed(true));
  }, []);

  const plotData = useMemo(() => {
    const zones = ["surface", "mid_level", "deep_core"] as const;
    const sym: Record<string, string> = { surface: "circle", mid_level: "square", deep_core: "diamond" };
    const label: Record<string, string> = { surface: "Surface (3.0m)", mid_level: "Mid-Level (1.5m)", deep_core: "Deep Core (0.2m)" };
    return zones.map(zone => {
      const zv = voxels.filter(v => v.zone === zone);
      return {
        type: "scatter3d", mode: "markers", name: label[zone],
        x: zv.map(v => v.x), y: zv.map(v => v.y), z: zv.map(v => v.z),
        hovertemplate: zv.map(v =>
          `Zone: ${label[zone]}<br>Pos: (${v.x},${v.y},${v.z}m)<br>Temp: ${v.temperature}°C${v.hotspot ? "<br>⚠️ HOTSPOT" : ""}<extra></extra>`
        ),
        marker: {
          size: zv.map(v => v.hotspot ? 14 : 9),
          symbol: sym[zone],
          color: zv.map(v => v.temperature),
          colorscale: "YlOrRd", cmin: 15, cmax: 45,
          opacity: zv.map(v => v.hotspot ? 1 : 0.82),
          line: { color: zv.map(v => v.hotspot ? "#ff4444" : "rgba(255,255,255,0.1)"), width: zv.map(v => v.hotspot ? 2 : 0.5) },
          colorbar: zone === "surface" ? {
            title: { text: "°C", font: { color: "#94a3b8", size: 11 } },
            tickfont: { color: "#94a3b8", size: 10 }, thickness: 14, len: 0.6, x: 1.02,
          } : undefined,
          showscale: zone === "surface",
        },
      };
    });
  }, [voxels]);

  const layout = useMemo(() => ({
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 0, r: 40, t: 10, b: 0 },
    showlegend: true,
    legend: { font: { color: "#94a3b8", size: 11 }, bgcolor: "rgba(15,23,42,0.8)", bordercolor: "#334155", borderwidth: 1, x: 0.01, y: 0.99, xanchor: "left", yanchor: "top" },
    scene: {
      bgcolor: "rgba(0,0,0,0)",
      xaxis: { title: { text: "X", font: { color: "#64748b" } }, tickfont: { color: "#64748b", size: 9 }, gridcolor: "#1e293b", zerolinecolor: "#334155", backgroundcolor: "rgba(0,0,0,0)", showbackground: true },
      yaxis: { title: { text: "Y", font: { color: "#64748b" } }, tickfont: { color: "#64748b", size: 9 }, gridcolor: "#1e293b", zerolinecolor: "#334155", backgroundcolor: "rgba(0,0,0,0)", showbackground: true },
      zaxis: { title: { text: "Depth (m)", font: { color: "#64748b" } }, tickfont: { color: "#64748b", size: 9 }, gridcolor: "#1e293b", zerolinecolor: "#334155", backgroundcolor: "rgba(0,0,0,0)", showbackground: true, range: [0, 4] },
      camera: { eye: { x: 1.6, y: 1.6, z: 1.2 } },
      aspectmode: "manual", aspectratio: { x: 1.2, y: 1.2, z: 0.7 },
    },
    uirevision: "camera",
  }), []);

  if (failed) return <Canvas2DHeatmap voxels={voxels} />;
  if (!Plot)  return (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <span>Loading 3D renderer…</span>
    </div>
  );

  return (
    <Plot
      data={plotData as object[]}
      layout={layout}
      config={{ responsive: true, displaylogo: false, scrollZoom: false, modeBarButtonsToRemove: ["toImage", "sendDataToCloud"] }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}

// ── Main export — picks renderer based on WebGL support ───────────────────
export default function Silo3DMap({ voxels }: Silo3DMapProps) {
  const [renderer, setRenderer] = useState<"3d" | "2d" | "loading">("loading");

  useEffect(() => {
    setRenderer(hasWebGL() ? "3d" : "2d");
  }, []);

  if (!voxels.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Awaiting telemetry…
      </div>
    );
  }

  if (renderer === "loading") {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span>Detecting renderer…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] relative" style={{ touchAction: "pan-y" }}>
      {/* Renderer badge */}
      <span className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-widest
                       text-slate-600 bg-slate-900/60 px-1.5 py-0.5 rounded">
        {renderer === "3d" ? "WebGL 3D" : "Canvas 2D"}
      </span>

      {renderer === "3d"
        ? <Plotly3DMap voxels={voxels} />
        : <Canvas2DHeatmap voxels={voxels} />}
    </div>
  );
}
