"use client";

import { Wifi, WifiOff, Shield, Activity, TrendingDown, Menu, X, Radio, Fan, Volume2, VolumeX, Mic, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import MetricsBar from "@/components/MetricsBar";
import Silo3DMap from "@/components/Silo3DMap";
import AlertFeed from "@/components/AlertFeed";
import KineticChart from "@/components/KineticChart";
import { useWebSocket, type ConnectionMode } from "@/hooks/useWebSocket";

// ── Shared types ───────────────────────────────────────────────────────────
export interface Voxel   { x: number; y: number; z: number; zone: string; temperature: number; hotspot: boolean; }
export interface Ambient { rh_surface: number; rh_mid: number; rh_core: number; co2_ppm: number; }
export interface Core    { temperature: number; rh: number; co2_ppm: number; }
export interface Kinetics {
  af: number; s_rem: number; t_core: number; rh_core: number; co2_ppm: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
export interface AlertEvent { id: string; type: string; severity: string; icon: string; message: string; timestamp: number; }
export interface TelemetryPayload {
  tick: number; timestamp: number; voxels: Voxel[]; ambient: Ambient; core: Core;
  hotspot_detected: boolean; hotspot_zone: string | null; kinetics: Kinetics; events: AlertEvent[];
}

const WS_URL = "ws://localhost:8000/ws/telemetry";
type Tab = "map" | "alerts" | "chart";
type Lang = "en" | "ta" | "hi";

// ── Multilingual Voice Dictionary ──────────────────────────────────────────
const VOICE_SCRIPTS = {
  en: {
    name: "English",
    voiceLang: "en-US",
    test: "SiloGuard Voice Active. Monitoring grain core temperature and humidity.",
    aeration: "Warning: Core temperature rising — aeration triggered.",
    hotspot: "Notice: Thermal hotspot detected in grain silo.",
    crisis: "Critical alert! Silo 4 thermal runaway in progress. Immediate intervention required.",
    cooling: "Auxiliary coolant purge complete. Silo core temperature stabilized.",
    nutrient: "Nutrient Recovery Mode activated! Damaged grain successfully diverted to biofuel digesters and animal feed processors. Value preserved."
  },
  ta: {
    name: "தமிழ்",
    voiceLang: "ta-IN",
    test: "சைலோகார்ட் குரல் எச்சரிக்கை தயார். தானிய களஞ்சியத்தின் வெப்பநிலை கண்காணிக்கப்படுகிறது.",
    aeration: "எச்சரிக்கை: களஞ்சியத்தின் வெப்பநிலை உயர்கிறது — காற்றோட்ட விசிறிகள் இயக்கப்பட்டுள்ளன.",
    hotspot: "களஞ்சியத்தில் அதிக வெப்ப புள்ளி கண்டறியப்பட்டுள்ளது.",
    crisis: "அபாய எச்சரிக்கை! சிலோ நான்கில் வெப்பநிலை அபாயகரமான நிலையை அடைந்துள்ளது. உடனடி பாதுகாப்பு நடவடிக்கை தேவை.",
    cooling: "துணை குளிரூட்டி செலுத்தப்பட்டது. வெப்பநிலை சீரமைக்கப்பட்டது.",
    nutrient: "ஊட்டச்சத்து மீட்பு முறை இயக்கப்பட்டது! சேதமடைந்த தானியம் உயிரி எரிபொருள் மற்றும் கால்நடை தீவன உற்பத்திக்கு மாற்றப்பட்டது. மதிப்பு பாதுகாக்கப்பட்டது."
  },
  hi: {
    name: "हिन्दी",
    voiceLang: "hi-IN",
    test: "साइलोगार्ड वॉयस अलर्ट सक्रिय है। अनाज के तापमान और नमी की निगरानी जारी है।",
    aeration: "चेतावनी: मुख्य तापमान बढ़ रहा है — वायु संचार पंखे चालू कर दिए गए हैं।",
    hotspot: "साइलो में अत्यधिक गर्म बिंदु का पता चला है।",
    crisis: "गंभीर चेतावनी! साइलो नंबर 4 में अत्यधिक तापमान बढ़ गया है। तत्काल कार्रवाई आवश्यक है।",
    cooling: "शीतलन प्रक्रिया पूरी हुई। तापमान सामान्य स्तर पर लौट आया है।",
    nutrient: "पोषक तत्व पुनर्प्राप्ति मोड सक्रिय! अनुपयोगी अनाज को जैव ईंधन और पशु आहार संयंत्रों में भेजा गया। मूल्य सुरक्षित।"
  }
};

export default function Home() {
  const { telemetry, alerts, connected, mode, tick } = useWebSocket(WS_URL);
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [menuOpen,  setMenuOpen]  = useState(false);

  // ── New Add-ons State ──
  const [currentLang, setCurrentLang] = useState<Lang>("en");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceCaption, setVoiceCaption] = useState("SiloGuard Voice Telemetry Active. System continuously monitoring core moisture & heat.");
  const [manualFanActive, setManualFanActive] = useState(false);
  const [nutrientActive, setNutrientActive] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const lastFanAnnouncedRef = useRef(0);

  // ── Speech synthesis helper ──
  const speakVoice = (text: string, langKey: Lang = currentLang) => {
    setVoiceCaption(text);
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const langData = VOICE_SCRIPTS[langKey];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langData.voiceLang;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  };

  const handleLangChange = (l: Lang) => {
    setCurrentLang(l);
    speakVoice(VOICE_SCRIPTS[l].test, l);
  };

  // ── 2-Minute Countdown Tracker ──
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          triggerCrisis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLang]);

  // ── Crisis Trigger ──
  const triggerCrisis = () => {
    setCrisisModalOpen(true);
    speakVoice(VOICE_SCRIPTS[currentLang].crisis);
  };

  // ── Auto Fan Audio Announcement ──
  const isFanAutoActive = (telemetry?.kinetics.s_rem ?? 250) < 150 || manualFanActive;
  useEffect(() => {
    if (isFanAutoActive && Date.now() - lastFanAnnouncedRef.current > 35000) {
      lastFanAnnouncedRef.current = Date.now();
      speakVoice(VOICE_SCRIPTS[currentLang].aeration);
    }
  }, [isFanAutoActive, currentLang]);

  const toggleManualFan = () => {
    const n = !manualFanActive;
    setManualFanActive(n);
    if (n) {
      speakVoice(VOICE_SCRIPTS[currentLang].aeration);
    }
  };

  const activateNutrientMode = () => {
    setNutrientActive(true);
    speakVoice(VOICE_SCRIPTS[currentLang].nutrient);
  };

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-slate-900 text-slate-100 overflow-x-hidden font-mono">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-emerald-500/20 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" strokeWidth={1.5} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">SiloGuard</h1>
            <p className="hidden sm:block text-[9px] text-slate-400 uppercase tracking-widest leading-none">
              Digital Twin · Voice AI & Circular Agritech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* 2-Minute Stress-Test Countdown */}
          <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/40 px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(239,68,68,0.2)]">
            <span className="hidden md:inline text-[9px] text-red-300 uppercase font-bold tracking-wider">🚨 Crisis in:</span>
            <span className="text-xs sm:text-sm font-bold text-red-400 tabular-nums">
              {Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}
            </span>
            <button
              onClick={triggerCrisis}
              className="bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded transition shadow-[0_0_8px_rgba(220,38,38,0.6)]">
              ⚡ Trigger Now
            </button>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <><Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline text-emerald-400 text-[10px] font-semibold uppercase tracking-widest">Live 1Hz</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /></>
            ) : (
              <><Radio className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden lg:inline text-yellow-400 text-[10px] font-semibold uppercase tracking-widest">Simulated</span></>
            )}
          </div>

          {/* Risk badge */}
          {telemetry && <RiskBadge level={telemetry.kinetics.risk_level} />}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(v => !v)} className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MULTILINGUAL VOICE TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">🗣️ Farmer Language:</span>
          <div className="inline-flex bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            {(["en", "ta", "hi"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  currentLang === l
                    ? "bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}>
                {l === "en" ? "🇬🇧 English" : l === "ta" ? "🇮🇳 தமிழ்" : "🇮🇳 हिन्दी"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Fan Manual Trigger Button */}
          <button
            onClick={toggleManualFan}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
              isFanAutoActive
                ? "bg-orange-950/60 border-orange-500 text-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.3)]"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
            }`}>
            <Fan className={`w-3.5 h-3.5 ${isFanAutoActive ? "animate-spin text-orange-400" : ""}`} />
            <span>{isFanAutoActive ? "Fans Active (100% RPM)" : "Manual Fan Trigger"}</span>
          </button>

          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
              voiceEnabled
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-700 text-slate-500"
            }`}>
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceEnabled ? "Voice: ON" : "Voice: Muted"}</span>
          </button>

          {/* Voice Sample Test */}
          <button
            onClick={() => speakVoice(VOICE_SCRIPTS[currentLang].aeration)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-950/40 border border-sky-500/40 text-sky-300 hover:bg-sky-900/50">
            <Mic className="w-3 h-3" />
            <span>Speak Sample</span>
          </button>
        </div>
      </div>

      {/* ── LIVE VOICE CAPTION BANNER ── */}
      <div className="flex items-center gap-2 px-3 sm:px-6 py-1.5 bg-slate-950/60 border-b border-slate-800/80 text-[11px] text-slate-300">
        <span className="text-emerald-400 animate-pulse">📢</span>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400">
          {VOICE_SCRIPTS[currentLang].name}
        </span>
        <span className="truncate text-slate-300 italic">“{voiceCaption}”</span>
      </div>

      {/* ── NUTRIENT RECOVERY BANNER (When Active) ── */}
      {nutrientActive && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-1.5 bg-emerald-950/70 border-b border-emerald-500/50 text-[11px] text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span className="font-bold">♻️ NUTRIENT RECOVERY ACTIVE: Damaged Grain Diverted to Methane Bio-Digestion & Animal Feed Pellets</span>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-emerald-900/80 border border-emerald-400 px-2 py-0.5 rounded">
            58% Value Rescued
          </span>
        </div>
      )}

      {/* ── KPI BAR ── */}
      <div className="px-2 sm:px-6 pt-3">
        <MetricsBar telemetry={telemetry} />
      </div>

      {/* ── MOBILE TAB BAR ── */}
      <div className="sm:hidden flex gap-1 px-2 pt-2">
        {(["map","alerts","chart"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors
              ${activeTab === tab ? "bg-slate-700 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:bg-slate-800/50"}`}>
            {tab === "map" ? "3D Map" : tab === "alerts" ? "Alerts" : "Chart"}
          </button>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <main className="flex-1 p-2 sm:p-6">
        <div className="hidden sm:grid sm:grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Silo #4 · 3D Multi-Depth Telemetry Grid</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                75 Telemetry Voxels
              </span>
            </div>
            <div className="flex-1 min-h-[380px] lg:min-h-[460px]">
              <Silo3DMap voxels={telemetry?.voxels ?? []} />
            </div>
          </section>

          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[380px] shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">🔔 System Event Feed</span>
              <span className="text-[9px] font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                Real-Time Triggers
              </span>
            </div>
            <AlertFeed alerts={alerts} connected={connected} />
          </section>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden">
          {activeTab === "map" && (
            <section className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-800 font-bold text-xs uppercase text-slate-300">3D Thermal Map</div>
              <div className="min-h-[340px]"><Silo3DMap voxels={telemetry?.voxels ?? []} /></div>
            </section>
          )}
          {activeTab === "alerts" && (
            <section className="bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[420px]">
              <div className="p-3 border-b border-slate-800 font-bold text-xs uppercase text-slate-300">System Event Feed</div>
              <AlertFeed alerts={alerts} connected={connected} />
            </section>
          )}
          {activeTab === "chart" && (
            <section className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-slate-800 font-bold text-xs uppercase text-slate-300">Kinetic Time Series</div>
              <div className="h-64 px-1 pb-2">
                <KineticChart tick={telemetry?.tick ?? 0} s_rem={telemetry?.kinetics.s_rem ?? 0}
                  af={telemetry?.kinetics.af ?? 0} t_core={telemetry?.core.temperature ?? 0} />
              </div>
            </section>
          )}
        </div>

        {/* Kinetic chart — Desktop */}
        <div className="hidden sm:block mt-4">
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Predictive Kinetic Model — S_rem · T_core · Af (120 Ticks)
                </span>
              </div>
              <span className="text-[9px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                Biological Spoilage Equation
              </span>
            </div>
            <div className="h-48 lg:h-56 px-2 pb-2">
              <KineticChart tick={telemetry?.tick ?? 0} s_rem={telemetry?.kinetics.s_rem ?? 0}
                af={telemetry?.kinetics.af ?? 0} t_core={telemetry?.core.temperature ?? 0} />
            </div>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-2 border-t border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950">
        <span>SiloGuard v2.6 · Multilingual Voice Alerts (EN/TA/HI) · Nutrient Recovery Protocol</span>
        <span className="font-mono">{telemetry ? new Date(telemetry.timestamp * 1000).toLocaleTimeString() : "—"}</span>
      </footer>

      {/* ── EMERGENCY CRISIS MODAL ── */}
      {crisisModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-950 border-2 border-red-500 rounded-2xl max-w-xl w-full shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-red-950/80 to-slate-950 p-4 border-b border-red-500/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/60 border-2 border-red-500 flex items-center justify-center text-xl animate-pulse">
                🚨
              </div>
              <div>
                <h2 className="text-base font-extrabold text-red-200">CRITICAL ABNORMALITY DETECTED</h2>
                <p className="text-[10px] uppercase font-bold text-red-400">Silo #4 Deep Core Thermal Runaway In Progress</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 border border-red-500/30 p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase text-slate-400">Core Hotspot Temp</div>
                  <div className="text-lg font-extrabold text-red-400">43.8°C</div>
                  <div className="text-[9px] text-red-300">+14.2°C above safe limit</div>
                </div>
                <div className="bg-slate-900 border border-red-500/30 p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase text-slate-400">Fungal Acceleration (Af)</div>
                  <div className="text-lg font-extrabold text-red-400">5.42x</div>
                  <div className="text-[9px] text-red-300">Exponential Mold Spore Bloom</div>
                </div>
                <div className="bg-slate-900 border border-red-500/30 p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase text-slate-400">Safe Storage Remaining</div>
                  <div className="text-lg font-extrabold text-red-400">22.8 Hours</div>
                  <div className="text-[9px] text-red-300">CRITICAL: Decay Imminent</div>
                </div>
                <div className="bg-slate-900 border border-red-500/30 p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase text-slate-400">Asset Value at Risk</div>
                  <div className="text-lg font-extrabold text-yellow-400">$46,500</div>
                  <div className="text-[9px] text-slate-400">1,200 Tons Hard Red Wheat</div>
                </div>
              </div>

              {/* NUTRIENT RECOVERY BOX */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">♻️ Nutrient Recovery Mode (Sustainability Protocol)</span>
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-900 border border-emerald-400 px-2 py-0.5 rounded text-emerald-300">
                    Circular Economy
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Instead of writing off spoiled grain as total waste, divert it into local anaerobic biofuel digesters and livestock feed processors to salvage economic value.
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div>Value Recovered: <strong className="text-emerald-400">58% ($26,800)</strong></div>
                  <div>Carbon Offset: <strong className="text-emerald-400">1.85T CO₂e</strong></div>
                  <div>Output: <strong className="text-emerald-400">40% Biogas + 60% Feed</strong></div>
                  <div>Landfill Waste: <strong className="text-emerald-400">0% (Closed-Loop)</strong></div>
                </div>
                <button
                  onClick={activateNutrientMode}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold py-2 rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  ♻️ Divert Grain to Biofuel Digester & Animal Feed
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCrisisModalOpen(false);
                  speakVoice(VOICE_SCRIPTS[currentLang].cooling);
                }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                ⚡ Deploy Auxiliary Purge (-6°C)
              </button>
              <button
                onClick={() => setCrisisModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition">
                Dismiss Modal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const RISK_CFG: Record<string,{bg:string;text:string;dot:string}> = {
  LOW:      {bg:"bg-emerald-950/60",text:"text-emerald-400",dot:"bg-emerald-400"},
  MEDIUM:   {bg:"bg-yellow-950/60", text:"text-yellow-400", dot:"bg-yellow-400" },
  HIGH:     {bg:"bg-orange-950/60", text:"text-orange-400", dot:"bg-orange-400" },
  CRITICAL: {bg:"bg-red-950/60",    text:"text-red-400",    dot:"bg-red-400"    },
};
function RiskBadge({ level }: { level: string }) {
  const c = RISK_CFG[level] ?? RISK_CFG.LOW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`}/>
      {level}
    </span>
  );
}
