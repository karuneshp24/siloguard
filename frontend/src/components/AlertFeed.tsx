"use client";

import { useEffect, useRef } from "react";
import type { AlertEvent } from "@/app/page";

interface AlertFeedProps {
  alerts: AlertEvent[];
  connected: boolean;
}

const SEVERITY_STYLES: Record<
  string,
  { border: string; bg: string; text: string; badge: string }
> = {
  CRITICAL: {
    border: "border-l-red-500",
    bg:     "bg-red-950/30",
    text:   "text-red-300",
    badge:  "bg-red-500/20 text-red-400 border border-red-500/30",
  },
  HIGH: {
    border: "border-l-orange-500",
    bg:     "bg-orange-950/30",
    text:   "text-orange-300",
    badge:  "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  },
  WARNING: {
    border: "border-l-yellow-500",
    bg:     "bg-yellow-950/30",
    text:   "text-yellow-300",
    badge:  "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  },
  INFO: {
    border: "border-l-sky-500",
    bg:     "bg-sky-950/30",
    text:   "text-sky-300",
    badge:  "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  },
};

function fallbackStyle() {
  return SEVERITY_STYLES.INFO;
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-IN", {
    hour12: false,
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AlertItem({ alert, isNew }: { alert: AlertEvent; isNew: boolean }) {
  const style = SEVERITY_STYLES[alert.severity] ?? fallbackStyle();

  return (
    <div
      className={`flex flex-col gap-0.5 px-3 py-2.5 border-l-2 ${style.border} ${style.bg} rounded-r-lg transition-all duration-300 ${isNew ? "animate-slide-in" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs leading-snug flex-1 ${style.text}`}>
          <span className="mr-1.5">{alert.icon}</span>
          {alert.message}
        </p>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${style.badge}`}
        >
          {alert.type.replace(/_/g, " ")}
        </span>
      </div>
      <span className="text-[10px] text-slate-600 font-mono">
        {formatTime(alert.timestamp)}
      </span>
    </div>
  );
}

export default function AlertFeed({ alerts, connected }: AlertFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLenRef   = useRef<number>(0);

  // Auto-scroll to top when new alerts arrive
  useEffect(() => {
    if (alerts.length > prevLenRef.current && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevLenRef.current = alerts.length;
  }, [alerts.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/40 bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
          />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            {connected ? "Streaming" : "Disconnected"}
          </span>
        </div>
        <span className="text-[10px] text-slate-600">
          {alerts.length} event{alerts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Event list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0"
      >
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
            <div className="text-3xl opacity-30">🛡️</div>
            <p className="text-slate-600 text-xs">
              {connected
                ? "Monitoring active — no events yet"
                : "Waiting for WebSocket connection…"}
            </p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <AlertItem key={alert.id} alert={alert} isNew={idx === 0} />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="shrink-0 border-t border-slate-700/40 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { sev: "CRITICAL", label: "Liquidation" },
          { sev: "HIGH",     label: "Fan Actuated" },
          { sev: "WARNING",  label: "Hotspot"      },
          { sev: "INFO",     label: "Info"          },
        ].map(({ sev, label }) => {
          const s = SEVERITY_STYLES[sev];
          return (
            <div key={sev} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-sm border-l-2 ${s.border}`} />
              <span className="text-[9px] text-slate-600 uppercase tracking-wider">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
