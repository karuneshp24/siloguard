"use client";

/**
 * KineticChart — pure SVG sparkline, zero extra dependencies.
 * Renders S_rem, T_core, and Af as three overlapping line series
 * with danger-zone bands. ~50× smaller than a Plotly equivalent.
 */
import { memo, useEffect, useRef, useState } from "react";

interface DataPoint { tick: number; s_rem: number; af: number; t_core: number; }
interface KineticChartProps { tick: number; s_rem: number; af: number; t_core: number; }

const MAX_PTS  = 120;   // 2 minutes at 1 Hz
const PAD      = { top: 12, right: 52, bottom: 28, left: 48 };

// ── Helpers ────────────────────────────────────────────────────────────────
function lerp(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin;
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function polyline(pts: [number, number][]) {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

// ── SVG Axis labels ────────────────────────────────────────────────────────
function YLabel({ x, y, value, color }: { x: number; y: number; value: string; color: string }) {
  return <text x={x} y={y} fill={color} fontSize={9} textAnchor="end" dominantBaseline="middle">{value}</text>;
}

// ── Main Component ─────────────────────────────────────────────────────────
const KineticChart = memo(function KineticChart({ tick, s_rem, af, t_core }: KineticChartProps) {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 180 });

  // Accumulate history
  useEffect(() => {
    if (tick === 0 && s_rem === 0) return;
    setHistory(prev => {
      const next = [...prev, { tick, s_rem, af, t_core }];
      return next.length > MAX_PTS ? next.slice(-MAX_PTS) : next;
    });
  }, [tick, s_rem, af, t_core]);

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(200, width), h: Math.max(100, height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const inner = {
    x0: PAD.left, y0: PAD.top,
    x1: w - PAD.right, y1: h - PAD.bottom,
    w:  w - PAD.left - PAD.right,
    h:  h - PAD.top  - PAD.bottom,
  };

  if (history.length < 2) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
        Collecting data…
      </div>
    );
  }

  // ── Data ranges ──
  const sRemMin = 0,   sRemMax = 800;
  const tMin    = 15,  tMax    = 45;
  const afMin   = 1,   afMax   = Math.max(5, ...history.map(d => d.af));

  const px = (i: number) => lerp(i, 0, history.length - 1, inner.x0, inner.x1);
  const pSRem  = (v: number) => lerp(v, sRemMin, sRemMax, inner.y1, inner.y0);
  const pTemp  = (v: number) => lerp(v, tMin,    tMax,    inner.y1, inner.y0);
  const pAf    = (v: number) => lerp(v, afMin,   afMax,   inner.y1, inner.y0);

  const sRemPts  = history.map((d, i): [number, number] => [px(i), pSRem(d.s_rem)]);
  const tempPts  = history.map((d, i): [number, number] => [px(i), pTemp(d.t_core)]);
  const afPts    = history.map((d, i): [number, number] => [px(i), pAf(d.af)]);

  // ── Danger bands (in s_rem space) ──
  const band48  = pSRem(48);
  const band150 = pSRem(150);
  const band200 = pSRem(200);

  const last = history[history.length - 1];

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%" height="100%"
        aria-label="Kinetic model time series chart"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* ── Background danger bands ── */}
        {/* Critical: < 48h */}
        <rect x={inner.x0} y={band48} width={inner.w} height={inner.y1 - band48}
          fill="rgba(239,68,68,0.06)" />
        {/* High: 48–150h */}
        <rect x={inner.x0} y={band150} width={inner.w} height={band48 - band150}
          fill="rgba(234,179,8,0.05)" />
        {/* Medium: 150–200h */}
        <rect x={inner.x0} y={band200} width={inner.w} height={band150 - band200}
          fill="rgba(251,191,36,0.03)" />

        {/* ── Threshold lines ── */}
        {[{ y: band48, label: "48h", color: "#ef4444" }, { y: band150, label: "150h", color: "#eab308" }, { y: band200, label: "200h", color: "#22c55e" }]
          .map(({ y, label, color }) => (
            <g key={label}>
              <line x1={inner.x0} y1={y} x2={inner.x1} y2={y}
                stroke={color} strokeWidth={0.75} strokeDasharray="3 3" opacity={0.5} />
              <text x={inner.x1 + 3} y={y} fill={color} fontSize={8} dominantBaseline="middle">{label}</text>
            </g>
          ))}

        {/* ── Grid lines (horizontal) ── */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = lerp(f, 0, 1, inner.y1, inner.y0);
          return <line key={f} x1={inner.x0} y1={y} x2={inner.x1} y2={y}
            stroke="#1e293b" strokeWidth={1} />;
        })}

        {/* ── Series lines ── */}
        {/* T_core (orange, dashed, right axis) */}
        <polyline points={polyline(tempPts)} fill="none"
          stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
        {/* Af (purple, dashed) */}
        <polyline points={polyline(afPts)} fill="none"
          stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="2 3" strokeLinejoin="round" />
        {/* S_rem (green, solid, filled) — drawn last so it's on top */}
        <polyline
          points={polyline([...sRemPts, [inner.x1, inner.y1], [inner.x0, inner.y1]])}
          fill="rgba(52,211,153,0.07)" stroke="none" />
        <polyline points={polyline(sRemPts)} fill="none"
          stroke="#34d399" strokeWidth={2} strokeLinejoin="round" />

        {/* ── Live endpoint dots ── */}
        <circle cx={sRemPts[sRemPts.length-1][0]} cy={sRemPts[sRemPts.length-1][1]}
          r={3} fill="#34d399" />
        <circle cx={tempPts[tempPts.length-1][0]} cy={tempPts[tempPts.length-1][1]}
          r={2.5} fill="#f97316" />
        <circle cx={afPts[afPts.length-1][0]} cy={afPts[afPts.length-1][1]}
          r={2.5} fill="#a78bfa" />

        {/* ── Y axis labels (left = S_rem) ── */}
        {[0, 200, 400, 600, 800].map(v => (
          <YLabel key={v} x={inner.x0 - 4} y={pSRem(v)} value={String(v)} color="#34d399" />
        ))}
        <text x={inner.x0 - 8} y={inner.y0 - 2} fill="#34d399" fontSize={9} textAnchor="middle"
          transform={`rotate(-90, ${inner.x0 - 32}, ${(inner.y0+inner.y1)/2})`}
          style={{ transformOrigin: `${inner.x0 - 32}px ${(inner.y0+inner.y1)/2}px` }}>
        </text>

        {/* ── X axis tick (last tick) ── */}
        <text x={inner.x1} y={inner.y1 + 14} fill="#475569" fontSize={9} textAnchor="end">
          t={last.tick}
        </text>
        <text x={inner.x0} y={inner.y1 + 14} fill="#475569" fontSize={9} textAnchor="start">
          t={history[0].tick}
        </text>

        {/* ── Legend ── */}
        {[
          { color: "#34d399", label: `S_rem ${last.s_rem.toFixed(1)}h`, dash: "" },
          { color: "#f97316", label: `T ${last.t_core.toFixed(1)}°C`,   dash: "4 2" },
          { color: "#a78bfa", label: `Af ${last.af.toFixed(3)}`,         dash: "2 3" },
        ].map(({ color, label, dash }, i) => (
          <g key={label} transform={`translate(${inner.x0 + i * 120}, ${inner.y0 - 2})`}>
            <line x1={0} y1={0} x2={16} y2={0}
              stroke={color} strokeWidth={2} strokeDasharray={dash || "0"} />
            <circle cx={8} cy={0} r={2.5} fill={color} />
            <text x={20} y={0} fill={color} fontSize={9} dominantBaseline="middle">{label}</text>
          </g>
        ))}

        {/* ── Axes ── */}
        <line x1={inner.x0} y1={inner.y0} x2={inner.x0} y2={inner.y1}
          stroke="#334155" strokeWidth={1} />
        <line x1={inner.x0} y1={inner.y1} x2={inner.x1} y2={inner.y1}
          stroke="#334155" strokeWidth={1} />
      </svg>
    </div>
  );
});

export default KineticChart;
