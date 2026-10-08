"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TelemetryPayload, AlertEvent } from "@/app/page";
import { simulateTick } from "@/lib/simulator";

const MAX_ALERTS = 60;
const RECONNECT_DELAY_MS = 4000;
const SIMULATE_INTERVAL_MS = 1000;

export type ConnectionMode = "live" | "simulated" | "connecting";

interface UseWebSocketReturn {
  telemetry: TelemetryPayload | null;
  alerts: AlertEvent[];
  connected: boolean;
  mode: ConnectionMode;
  tick: number;
}

function mergeAlerts(incoming: AlertEvent[], prev: AlertEvent[]): AlertEvent[] {
  const seen = new Set<string>();
  return [...incoming, ...prev]
    .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
    .slice(0, MAX_ALERTS);
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [telemetry, setTelemetry]   = useState<TelemetryPayload | null>(null);
  const [alerts, setAlerts]         = useState<AlertEvent[]>([]);
  const [connected, setConnected]   = useState(false);
  const [mode, setMode]             = useState<ConnectionMode>("connecting");
  const [tick, setTick]             = useState(0);

  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simTickRef     = useRef(0);
  const mountedRef     = useRef(true);

  // ── Stop simulator ────────────────────────────────────────────────────
  const stopSim = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  }, []);

  // ── Start simulator ───────────────────────────────────────────────────
  const startSim = useCallback(() => {
    if (simIntervalRef.current) return;          // already running
    setMode("simulated");
    setConnected(false);

    simIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const payload = simulateTick(simTickRef.current++);
      setTelemetry(payload);
      setTick(payload.tick);
      if (payload.events.length > 0) {
        setAlerts(prev => mergeAlerts(payload.events, prev));
      }
    }, SIMULATE_INTERVAL_MS);
  }, []);

  // ── Apply incoming WS payload ─────────────────────────────────────────
  const applyPayload = useCallback((payload: TelemetryPayload) => {
    setTelemetry(payload);
    setTick(payload.tick);
    if (payload.events.length > 0) {
      setAlerts(prev => mergeAlerts(payload.events, prev));
    }
  }, []);

  // ── Connect to WebSocket (with sim fallback) ──────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Only attempt WS in browsers that support it
    if (typeof WebSocket === "undefined") {
      startSim();
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      startSim();
      return;
    }
    wsRef.current = ws;

    // If WS doesn't open within 3s, fall back to simulator
    const openTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        startSim();
      }
    }, 3000);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      clearTimeout(openTimeout);
      stopSim();                        // stop simulator if it was running
      setConnected(true);
      setMode("live");
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (evt: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        applyPayload(JSON.parse(evt.data) as TelemetryPayload);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      clearTimeout(openTimeout);
      setConnected(false);
      setMode("simulated");
      startSim();                       // fall back to simulator immediately
      reconnectRef.current = setTimeout(() => {
        stopSim();
        setMode("connecting");
        connect();
      }, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      clearTimeout(openTimeout);
      ws.close();
    };
  }, [url, startSim, stopSim, applyPayload]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { telemetry, alerts, connected, mode, tick };
}
