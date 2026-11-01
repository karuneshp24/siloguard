import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
import time
import subprocess
import imageio_ffmpeg

print("==================================================================")
print("SiloGuard 9.5-Minute Official AI Cinematic Presentation Generator")
print("==================================================================")

WIDTH = 1280
HEIGHT = 720
FPS = 20
SCENE_DUR = 64
NUM_SCENES = 9
TOTAL_SECONDS = SCENE_DUR * NUM_SCENES  # 576s = 9m 36s
TOTAL_FRAMES = TOTAL_SECONDS * FPS      # 11,520 frames

BASE_DIR = r"C:\Users\Karunesh P\OneDrive\Desktop\Hack\siloguard"
SCREEN_DIR = os.path.join(BASE_DIR, "screenshots")
TEMP_VIDEO = os.path.join(BASE_DIR, "temp_video_9m.mp4")
AUDIO_FILE = os.path.join(BASE_DIR, "merged_narration.wav")
FINAL_MP4 = os.path.join(BASE_DIR, "SiloGuard_AI_Presentation.mp4")

# Load real app screenshots
screenshots = {}
for name, fname in [
    ("index", "screen_index.png"),
    ("siloguard", "screen_siloguard.png"),
    ("biofuel", "screen_biofuel.png"),
    ("virtualsilo", "screen_virtualsilo.png")
]:
    p = os.path.join(SCREEN_DIR, fname)
    if os.path.exists(p):
        screenshots[name] = Image.open(p).convert("RGB")
        print(f"Loaded screenshot {fname}: {screenshots[name].size}")
    else:
        print(f"Warning: {fname} not found!")

# Fonts
try:
    font_large = ImageFont.truetype("arialbd.ttf", 40)
    font_mid = ImageFont.truetype("arialbd.ttf", 22)
    font_sub = ImageFont.truetype("arial.ttf", 18)
    font_small = ImageFont.truetype("arialbd.ttf", 15)
    font_hud = ImageFont.truetype("consola.ttf", 16)
    font_subtitles = ImageFont.truetype("arialbd.ttf", 19)
except:
    font_large = font_mid = font_sub = font_small = font_hud = font_subtitles = ImageFont.load_default()

scenes = [
    {
        "index": 1,
        "tag": "SCENE 1 OF 9 · GLOBAL FOOD CRISIS & THE BLINDSPOT",
        "title": "THE INVISIBLE GRAIN STORAGE CRISIS",
        "subtitle": "Microscopic Heat Anomalies Multiply Spores 72 Hours in Advance",
        "color": (239, 68, 68),
        "type": "crisis",
        "subtitles": [
            (0, 14, "Across the globe, over 1.3 billion tons of harvested food grain are lost annually."),
            (14, 28, "Post-harvest storage losses account for up to 30% of total agricultural yields worldwide."),
            (28, 44, "Microscopic moisture pockets deep in the grain core multiply fungal spores 72 hours early."),
            (44, 64, "SiloGuard eliminates this blindspot with software-defined cyber-physical intelligence.")
        ]
    },
    {
        "index": 2,
        "tag": "SCENE 2 OF 9 · APP SCREEN WALKTHROUGH: MASTER HUB",
        "title": "LIVE MASTER COMMAND HUB & OPTION SWITCHER",
        "subtitle": "Unified Command Deck, Global Telemetry Ticker & Presentation Themes",
        "color": (52, 211, 153),
        "type": "app_screen",
        "screen_key": "index",
        "focus_text": "Live Master Hub: Mode Switcher, 1Hz Telemetry Ticker & Emerald/Cyan Themes",
        "subtitles": [
            (0, 14, "Master Command Hub: A unified deck with live global telemetry across all active silos."),
            (14, 28, "Single-click switcher: 60% Grain Twin, 40% Biofuel, 3D Virtual Silo & Split Presenter."),
            (28, 44, "Visual atmosphere controls: Emerald Quantum, Cyber Cyan, and Obsidian Gold themes."),
            (44, 64, "Ultra-low latency WebSocket streaming sensory data directly to the operator's dashboard.")
        ]
    },
    {
        "index": 3,
        "tag": "SCENE 3 OF 9 · APP SCREEN WALKTHROUGH: 60% DIGITAL TWIN",
        "title": "75-VOXEL 3D TELEMETRY & PROPORTIONAL ZOOM",
        "subtitle": "Multi-Depth Density: Surface, Mid-Zone & Deep Core Foundation",
        "color": (56, 189, 248),
        "type": "app_screen",
        "screen_key": "siloguard",
        "focus_text": "60% Grain Silo Twin: 75-Voxel Multi-Depth Grid & Centered Proportional Zoom",
        "subtitles": [
            (0, 14, "60% Grain Silo Digital Twin: 75-voxel multi-depth telemetry grid on Silo #4."),
            (14, 28, "Distributed sensory voxels across Surface Layer, Mid-Zone, and Deep Core Foundation."),
            (28, 44, "Centered proportional zoom controls from 50% to 200% for distortion-free voxel inspection."),
            (44, 64, "Voxel 42 registers 43.8°C thermal anomaly—instantly isolated and flagged by AI.")
        ]
    },
    {
        "index": 4,
        "tag": "SCENE 4 OF 9 · PREDICTIVE BIOLOGICAL KINETICS",
        "title": "ARRHENIUS KINETICS & SPORE ACCELERATION",
        "subtitle": "Af Fungal Factor & Moisture Sorption Isotherms Predict Shelf Life (S_rem)",
        "color": (245, 158, 11),
        "type": "kinetics",
        "subtitles": [
            (0, 14, "Predictive kinetics engine: Modeling biological degradation and spore growth velocity."),
            (14, 28, "Arrhenius fungal acceleration equation Af dynamically calculates microbial runaway risk."),
            (28, 44, "Moisture sorption isotherms calculate safe storage remaining: S_rem = 22.8 hours."),
            (44, 64, "Detects fungal proliferation 72 hours before visible mold or toxic mycotoxins form.")
        ]
    },
    {
        "index": 5,
        "tag": "SCENE 5 OF 9 · AUTONOMOUS EMERGENCY CRISIS DEFENSE",
        "title": "2-MINUTE RUNAWAY COUNTDOWN & TURBO FANS",
        "subtitle": "Autonomous VFD Aeration Intercept & Multilingual Voice Broadcast (EN/TA/HI)",
        "color": (239, 68, 68),
        "type": "emergency",
        "subtitles": [
            (0, 14, "Autonomous Crisis Defense: 2-minute emergency countdown activates automatically."),
            (14, 28, "Localized VFD turbo aeration fans engage, channeling chilled air into deep-core hot spots."),
            (28, 44, "High-decibel acoustic defense sirens sound on site to alert facility staff."),
            (44, 64, "Multilingual voice alerts broadcast in English, Tamil, and Hindi without language barriers.")
        ]
    },
    {
        "index": 6,
        "tag": "SCENE 6 OF 9 · FARMER OMNI-CHANNEL DISPATCH",
        "title": "TARGET: +91 8220480281 · 24/7/365 CLOUD EDGE",
        "subtitle": "Instant WhatsApp, Cellular SMS, Priority Push & Zero-Lag Mobile Access",
        "color": (34, 197, 94),
        "type": "farmer",
        "subtitles": [
            (0, 14, "Farmer Omni-Channel Dispatch: Live alerts transmitted to target number +91 8220480281."),
            (14, 28, "Instant WhatsApp rich alerts, cellular SMS, and high-priority push notifications."),
            (28, 44, "Cloud edge deployment works 24/7/365 on mobile phones over 4G/5G even if local PC is off."),
            (44, 64, "Farmers review thermal telemetry and authorize emergency protocols with a single tap.")
        ]
    },
    {
        "index": 7,
        "tag": "SCENE 7 OF 9 · DYNAMIC LIQUIDATION FLASH AUCTION",
        "title": "REAL-TIME ALGORITHMIC CAPITAL RESCUE",
        "subtitle": "Dynamic 20%-35% Markdown Connecting Regional Flour Mills & Processors",
        "color": (245, 158, 11),
        "type": "auction",
        "subtitles": [
            (0, 14, "Dynamic Flash Auction: Salvaging agricultural capital when grain cannot be stored long-term."),
            (14, 28, "Algorithmic discount model (20% to 35% markdown) based on remaining safe shelf life."),
            (44, 44, "Connected flour mills and feed processors receive instant bidding notifications."),
            (44, 64, "Guarantees farmer liquidity, prevents total financial loss, and preserves food supply.")
        ]
    },
    {
        "index": 8,
        "tag": "SCENE 8 OF 9 · APP SCREEN: 40% CIRCULAR BIOFUEL PLANT",
        "title": "ZERO-WASTE VALORIZATION & CLEAN BIOMETHANE",
        "subtitle": "Anaerobic Digester: 74.2% CH4 Purity, 418 kW Power & Organic Bio-Fertilizer",
        "color": (6, 182, 212),
        "type": "app_screen",
        "screen_key": "biofuel",
        "focus_text": "40% Biofuel Facility: Anaerobic Digestion, 74.2% Methane & 418 kW Generator",
        "subtitles": [
            (0, 14, "40% Circular Biofuel Facility: Diverting heavily damaged grain into clean bio-energy."),
            (14, 28, "On-site anaerobic digester converts compromised starch through controlled methanogenesis."),
            (28, 44, "Biogas purity reaches 74.2% pure methane (CH4), powering a 418 kW generator."),
            (44, 64, "Supplies clean electricity to rural power grids while producing organic bio-fertilizer.")
        ]
    },
    {
        "index": 9,
        "tag": "SCENE 9 OF 9 · APP SCREEN: 3D VIRTUAL SILO & ROADMAP",
        "title": "3D VIRTUAL SILO & THE UNIFIED AGRITECH REVOLUTION",
        "subtitle": "60% Food Grain Preserved + 40% Clean Energy Valorized · 8.4x ROI",
        "color": (52, 211, 153),
        "type": "app_screen",
        "screen_key": "virtualsilo",
        "focus_text": "3D Virtual Silo Table: Wireframe Column Inspection & 60/40 Circular Architecture",
        "subtitles": [
            (0, 14, "3D Virtual Silo Table: Interactive isometric wireframe with vertical core column inspection."),
            (14, 28, "Unified Closed-Loop Economy: 60% food grain preserved, 40% clean energy generated."),
            (28, 44, "Proven 8.4x economic return on investment, eliminating agricultural food waste."),
            (44, 64, "SiloGuard: Preserving our harvest, protecting our farmers, powering our future.")
        ]
    }
]

# Initialize video writer
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(TEMP_VIDEO, fourcc, FPS, (WIDTH, HEIGHT))

print(f"Rendering {TOTAL_FRAMES} frames ({TOTAL_SECONDS}s at {FPS} FPS)...")
start_render = time.time()
frame_idx = 0

for sc in scenes:
    sc_num = sc["index"]
    sc_type = sc["type"]
    tag = sc["tag"]
    title = sc["title"]
    subtitle = sc["subtitle"]
    color = sc["color"]
    subs = sc["subtitles"]
    
    print(f"--> Rendering Scene {sc_num}/{NUM_SCENES}: {title} ({SCENE_DUR * FPS} frames)...")
    
    for f in range(SCENE_DUR * FPS):
        t_sec = f / FPS  # seconds within this scene (0 to 64)
        abs_t = (sc_num - 1) * SCENE_DUR + t_sec
        
        # Base canvas
        img = Image.new("RGB", (WIDTH, HEIGHT), color=(6, 10, 18))
        draw = ImageDraw.Draw(img)
        
        # Background Cyber Grid Lines
        for y in range(0, HEIGHT, 60):
            draw.line([(0, y), (WIDTH, y)], fill=(12, 18, 30), width=1)
        for x in range(0, WIDTH, 60):
            draw.line([(x, 0), (x, HEIGHT)], fill=(12, 18, 30), width=1)
            
        # Top HUD Bar
        draw.text((40, 25), "● SILOGUARD CLOUD CORE · 1Hz REAL-TIME TELEMETRY", fill=(52, 211, 153), font=font_hud)
        time_str = f"{int(abs_t//60):02d}:{int(abs_t%60):02d} / 09:36 | 75 VOXELS"
        draw.text((WIDTH - 280, 25), time_str, fill=(56, 189, 248), font=font_hud)
        
        # Scene Tag Pill
        draw.rectangle([40, 60, 480, 90], fill=(20, 30, 48), outline=color, width=1)
        draw.text((55, 66), tag, fill=color, font=font_small)
        
        # Title and Subtitle
        draw.text((40, 105), title, fill=(255, 255, 255), font=font_large)
        draw.text((40, 158), subtitle, fill=(148, 163, 184), font=font_sub)
        
        # ── SCENE SPECIFIC CONTENT ──
        if sc_type == "app_screen":
            # Display real app screenshot inside a cyber frame
            s_key = sc.get("screen_key", "index")
            if s_key in screenshots:
                s_img = screenshots[s_key]
                # Scale screenshot to fit inside (920 x 410) with subtle panning effect
                crop_w = int(1920 - 120 * np.sin(t_sec * 0.1))
                crop_h = int(1080 - 68 * np.sin(t_sec * 0.1))
                crop_x = int((1920 - crop_w) * 0.5 + 40 * np.sin(t_sec * 0.15))
                crop_y = int((1080 - crop_h) * 0.5)
                cropped = s_img.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
                
                disp_w = 900
                disp_h = 390
                resized = cropped.resize((disp_w, disp_h), Image.Resampling.BILINEAR)
                
                # Paste screenshot
                img.paste(resized, (40, 205))
                
                # Cyber Frame around screenshot
                draw.rectangle([38, 203, 40 + disp_w + 2, 205 + disp_h + 2], outline=color, width=2)
                
                # Live badge overlay on top right of screenshot
                draw.rectangle([40 + disp_w - 170, 215, 40 + disp_w - 10, 245], fill=(3, 7, 18), outline=(52, 211, 153), width=1)
                draw.text((40 + disp_w - 155, 222), "🔴 LIVE APP SCREEN", fill=(52, 211, 153), font=font_small)
                
                # Right Info Sidebar next to screenshot (x: 960 to 1240)
                draw.rectangle([960, 205, 1240, 205 + disp_h], fill=(12, 18, 32), outline=(30, 41, 59), width=1)
                draw.text((980, 225), "MODULE DETAILS", fill=color, font=font_small)
                draw.line([(980, 248), (1220, 248)], fill=(30, 41, 59), width=1)
                
                if s_key == "index":
                    draw.text((980, 265), "• Master Switcher", fill=(255, 255, 255), font=font_sub)
                    draw.text((980, 295), "• 60/40 Split Presenter", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 325), "• Emerald/Cyan Themes", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 355), "• Guided Pitch HUD", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 395), "Latency: <45ms", fill=(52, 211, 153), font=font_mid)
                    draw.text((980, 430), "WebSocket 1Hz", fill=(56, 189, 248), font=font_small)
                    draw.text((980, 460), "Cloud Edge: 24/7/365", fill=(245, 158, 11), font=font_small)
                elif s_key == "siloguard":
                    draw.text((980, 265), "• 75-Voxel Grid", fill=(255, 255, 255), font=font_sub)
                    draw.text((980, 295), "• Multi-Depth Telemetry", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 325), "• Proportional Centered Zoom", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 355), "• Voxel 42: 43.8°C", fill=(239, 68, 68), font=font_mid)
                    draw.text((980, 395), "Af: 5.42x Spores", fill=(239, 68, 68), font=font_small)
                    draw.text((980, 425), "S_rem: 22.8 Hours", fill=(245, 158, 11), font=font_small)
                    draw.text((980, 460), "Preservation: 60%", fill=(52, 211, 153), font=font_mid)
                elif s_key == "biofuel":
                    draw.text((980, 265), "• Anaerobic Digester", fill=(255, 255, 255), font=font_sub)
                    draw.text((980, 295), "• Continuous Feed Auger", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 325), "• CH4 Purity: 74.2%", fill=(6, 182, 212), font=font_mid)
                    draw.text((980, 365), "• Electricity: 418 kW", fill=(52, 211, 153), font=font_mid)
                    draw.text((980, 405), "• Organic Bio-Fertilizer", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 435), "• Zero Landfill Waste", fill=(52, 211, 153), font=font_small)
                    draw.text((980, 465), "Valorization: 40%", fill=(6, 182, 212), font=font_mid)
                elif s_key == "virtualsilo":
                    draw.text((980, 265), "• 3D Isometric Mesh", fill=(255, 255, 255), font=font_sub)
                    draw.text((980, 295), "• Vertical Sensor Probes", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 325), "• Cross-Section Heatmap", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 365), "• Slice Anomaly Inspector", fill=(148, 163, 184), font=font_small)
                    draw.text((980, 405), "ROI Return: 8.4x", fill=(52, 211, 153), font=font_mid)
                    draw.text((980, 440), "SiloGuard 60/40 Loop", fill=(245, 158, 11), font=font_small)
                    draw.text((980, 470), "Open-Source & Cloud", fill=(56, 189, 248), font=font_small)
                    
        elif sc_type == "crisis":
            # Animated 3D Silo with internal hotspot
            draw.rectangle([100, 220, 420, 560], fill=(18, 24, 38), outline=(255, 255, 255), width=2)
            # Silo Dome
            draw.arc([100, 180, 420, 260], start=180, end=360, fill=(52, 211, 153), width=2)
            # Hotspot pulse
            pulse_r = int(35 + 18 * np.sin(t_sec * 5))
            draw.ellipse([260 - pulse_r, 410 - pulse_r, 260 + pulse_r, 410 + pulse_r], fill=(239, 68, 68))
            draw.text((150, 400), "HOTSPOT", fill=(255, 255, 255), font=font_small)
            
            # Right explanation panel
            draw.rectangle([460, 220, 1200, 560], fill=(12, 18, 30), outline=(239, 68, 68), width=2)
            draw.text((500, 250), "THE POST-HARVEST STORAGE BLINDSPOT", fill=(239, 68, 68), font=font_mid)
            draw.text((500, 300), "• 1.3 Billion Tons of grain lost annually across global silos", fill=(255, 255, 255), font=font_sub)
            draw.text((500, 340), "• Up to 30% total harvest spoilage from metabolic respiration", fill=(255, 255, 255), font=font_sub)
            draw.text((500, 380), "• Single-point legacy probes miss 85% of interior volume", fill=(245, 158, 11), font=font_sub)
            draw.text((500, 420), "• Heat accelerates Aspergillus flavus mold 72 hours before visible signs", fill=(239, 68, 68), font=font_sub)
            draw.text((500, 475), "SOLUTION: SiloGuard 75-Voxel Cyber-Physical Spatial Telemetry", fill=(52, 211, 153), font=font_mid)
            
        elif sc_type == "kinetics":
            # Mathematical Kinetics & Arrhenius Equation
            draw.rectangle([80, 220, 600, 560], fill=(12, 18, 30), outline=(245, 158, 11), width=2)
            draw.text((110, 245), "BIOLOGICAL KINETICS FORMULATION", fill=(245, 158, 11), font=font_mid)
            draw.text((110, 290), "Arrhenius Spore Acceleration Factor:", fill=(148, 163, 184), font=font_small)
            draw.text((110, 325), "Af = exp [ (Ea / R) * (1/T_base - 1/T_core) ]", fill=(56, 189, 248), font=font_mid)
            draw.text((110, 380), "Instantaneous Value: Af = 5.42x Velocity", fill=(239, 68, 68), font=font_mid)
            draw.text((110, 420), "Water Activity aw: 0.742 (Critical Spore Threshold)", fill=(245, 158, 11), font=font_sub)
            draw.text((110, 460), "Safe Storage Time Remaining (S_rem):", fill=(148, 163, 184), font=font_small)
            draw.text((110, 495), "S_rem = 22.8 Hours Left", fill=(239, 68, 68), font=font_large)
            
            # Dynamic Kinetics Plot
            draw.rectangle([640, 220, 1200, 560], fill=(10, 14, 24), outline=(56, 189, 248), width=1)
            draw.text((670, 245), "SPORE MULTIPLICATION VELOCITY vs TIME", fill=(56, 189, 248), font=font_small)
            # Axes
            draw.line([(700, 510), (1160, 510)], fill=(100, 116, 139), width=2)
            draw.line([(700, 510), (700, 290)], fill=(100, 116, 139), width=2)
            # Plot exponential curve
            pts = []
            for px in range(700, 1160, 5):
                progress = (px - 700) / 460
                py = int(510 - 200 * (progress ** 2.2))
                pts.append((px, py))
            draw.line(pts, fill=(239, 68, 68), width=3)
            # Current time pointer
            cur_px = int(700 + 460 * (0.6 + 0.1 * np.sin(t_sec * 0.5)))
            cur_py = int(510 - 200 * (((cur_px - 700) / 460) ** 2.2))
            draw.ellipse([cur_px - 6, cur_py - 6, cur_px + 6, cur_py + 6], fill=(255, 255, 255))
            draw.text((cur_px - 80, cur_py - 30), "CURRENT: 43.8°C", fill=(255, 255, 255), font=font_small)
            draw.text((700, 525), "0h", fill=(148, 163, 184), font=font_small)
            draw.text((910, 525), "36h", fill=(148, 163, 184), font=font_small)
            draw.text((1120, 525), "72h (VISIBLE CRUSTING)", fill=(239, 68, 68), font=font_small)
            
        elif sc_type == "emergency":
            # Emergency Countdown & Aeration Fans
            strobe = int(abs_t * 6) % 2 == 0
            border_c = (239, 68, 68) if strobe else (180, 30, 30)
            draw.rectangle([80, 220, 1200, 560], fill=(24, 10, 16), outline=border_c, width=3)
            
            # Big Countdown
            draw.text((120, 250), "🚨 CRITICAL THERMAL RUNAWAY SEQUENCER", fill=(239, 68, 68), font=font_mid)
            countdown_sec = max(0, 120 - int(t_sec * 1.8))
            draw.text((120, 290), f"COUNTDOWN: 01:{countdown_sec:02d}", fill=(255, 255, 255), font=font_large)
            
            # Defense Actions
            draw.text((120, 360), "✔ Localized VFD Turbo Aeration Fans: ENGAGED (3400 RPM)", fill=(52, 211, 153), font=font_sub)
            draw.text((120, 400), "✔ Chilled Micro-Airflow channeled directly to Deep Core Voxel 42", fill=(56, 189, 248), font=font_sub)
            draw.text((120, 440), "✔ High-Decibel Acoustic Warning Siren: ACTIVE ON SITE", fill=(245, 158, 11), font=font_sub)
            draw.text((120, 480), "✔ Multilingual Speech Broadcast: English, Tamil (தமிழ்), Hindi (हिंदी)", fill=(255, 255, 255), font=font_sub)
            
            # Right side animated fan
            fan_cx, fan_cy = 1000, 390
            draw.ellipse([fan_cx - 80, fan_cy - 80, fan_cx + 80, fan_cy + 80], outline=(52, 211, 153), width=3)
            fan_angle = t_sec * 15
            for a_offset in [0, 2*np.pi/3, 4*np.pi/3]:
                ang = fan_angle + a_offset
                bx = fan_cx + int(70 * np.cos(ang))
                by = fan_cy + int(70 * np.sin(ang))
                draw.line([(fan_cx, fan_cy), (bx, by)], fill=(52, 211, 153), width=6)
            draw.text((fan_cx - 65, fan_cy + 95), "TURBO VFD FAN", fill=(52, 211, 153), font=font_small)
            
        elif sc_type == "farmer":
            # WhatsApp Card & Mobile Dispatch
            draw.rectangle([80, 210, 620, 560], fill=(12, 22, 20), outline=(34, 197, 94), width=2)
            draw.text((110, 235), "🟢 WhatsApp Farmer Emergency Alert", fill=(34, 197, 94), font=font_mid)
            draw.text((110, 275), "Target: +91 8220480281", fill=(255, 255, 255), font=font_mid)
            draw.line([(110, 310), (590, 310)], fill=(30, 50, 40), width=1)
            
            draw.text((110, 330), "🚨 SILOGUARD FARMER CRITICAL ALERT", fill=(239, 68, 68), font=font_small)
            draw.text((110, 360), "Deep Core Temp surged to 43.8°C (+14.2°C anomaly).", fill=(255, 255, 255), font=font_small)
            draw.text((110, 385), "Safe storage remaining: 22.8 hours.", fill=(245, 158, 11), font=font_small)
            draw.text((110, 410), "60% Grain Preserved / 40% Diverted to Biofuel.", fill=(52, 211, 153), font=font_small)
            draw.text((110, 445), "View Live Digital Twin: https://karuneshp24.github.io/siloguard/", fill=(56, 189, 248), font=font_small)
            
            draw.text((110, 495), "✔ Cellular SMS Dispatched", fill=(34, 197, 94), font=font_small)
            draw.text((360, 495), "✔ High-Priority Push Sent", fill=(34, 197, 94), font=font_small)
            
            # Right side mobile benefits
            draw.rectangle([660, 210, 1200, 560], fill=(10, 16, 28), outline=(56, 189, 248), width=2)
            draw.text((690, 235), "PERMANENT 24/7/365 MOBILE ACCESS", fill=(56, 189, 248), font=font_mid)
            draw.text((690, 285), "• Hosted on GitHub Global Edge CDN with 100% Uptime", fill=(255, 255, 255), font=font_sub)
            draw.text((690, 325), "• Runs on any mobile smartphone (iOS & Android) over 4G/5G", fill=(255, 255, 255), font=font_sub)
            draw.text((690, 365), "• Never goes down when the facility PC sleeps or turns off", fill=(52, 211, 153), font=font_sub)
            draw.text((690, 405), "• One-tap authorization: Farmers execute defense from anywhere", fill=(245, 158, 11), font=font_sub)
            draw.text((690, 460), "Target Verified: +91 8220480281 Active", fill=(34, 197, 94), font=font_mid)
            
        elif sc_type == "auction":
            # Dynamic Flash Auction Order Book
            draw.rectangle([80, 220, 1200, 560], fill=(18, 14, 10), outline=(245, 158, 11), width=2)
            draw.text((110, 245), "⚖️ REAL-TIME DYNAMIC LIQUIDATION FLASH AUCTION", fill=(245, 158, 11), font=font_mid)
            draw.text((110, 285), "Dynamic Markdown: 35% Discount Applied (Safe Storage: 22.8 Hours)", fill=(255, 255, 255), font=font_sub)
            
            # Bidding table
            headers = ["BUYER / COMMERCIAL ENTITY", "BID QUANTITY", "UNIT PRICE", "DISPATCH STATUS"]
            draw.text((110, 335), f"{headers[0]:<35} {headers[1]:<15} {headers[2]:<15} {headers[3]}", fill=(148, 163, 184), font=font_small)
            draw.line([(110, 360), (1170, 360)], fill=(50, 40, 30), width=1)
            
            bids = [
                ("Apex Flour Mills (Regional)", "250 Tons", "$178 / Ton (-35%)", "CONFIRMED ✔"),
                ("Southern Poultry Feed Corp", "180 Tons", "$176 / Ton (-36%)", "PENDING TRUCK"),
                ("GreenFields Bakery Alliance", "120 Tons", "$182 / Ton (-34%)", "DISPATCH READY"),
                ("Delta Bio-Starch Refineries", "300 Tons", "$175 / Ton (-36%)", "ACCEPTED")
            ]
            y_bid = 380
            for buyer, qty, pr, st in bids:
                draw.text((110, y_bid), f"{buyer:<35} {qty:<15} {pr:<15} {st}", fill=(255, 255, 255), font=font_small)
                y_bid += 35
                
            draw.text((110, 520), "CAPITAL SAVED: $184,500 Preserved for Farmer vs Total Write-off", fill=(52, 211, 153), font=font_mid)
            
        # ── SYNCHRONIZED BOTTOM SUBTITLE HUD ──
        sub_box_y = HEIGHT - 105
        draw.rectangle([40, sub_box_y, WIDTH - 40, sub_box_y + 70], fill=(2, 6, 18), outline=(52, 211, 153), width=1)
        
        # Find active subtitle text for this second
        active_sub = ""
        for s_start, s_end, s_txt in subs:
            if s_start <= t_sec <= s_end:
                active_sub = s_txt
                break
        if not active_sub and subs:
            active_sub = subs[-1][2]
            
        # Draw subtitle text
        draw.text((60, sub_box_y + 22), active_sub, fill=(255, 255, 255), font=font_subtitles)
        
        # Convert to OpenCV BGR frame and write
        frame_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        out.write(frame_bgr)
        frame_idx += 1

out.release()
dt_sec = time.time() - start_render
print(f"Render completed: {frame_idx} frames rendered in {dt_sec:.1f}s ({frame_idx/dt_sec:.1f} FPS)!")

# Now mux with audio using FFmpeg
print("Muxing video with 9.5-minute audio narration track...")
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

cmd_mux = [
    ffmpeg_exe, "-y",
    "-i", TEMP_VIDEO,
    "-i", AUDIO_FILE,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    FINAL_MP4
]

res = subprocess.run(cmd_mux, capture_output=True, text=True)
if res.returncode == 0:
    print(f"SUCCESS! Rendered final 9.5-minute presentation: {FINAL_MP4}")
    print(f"Final MP4 Size: {os.path.getsize(FINAL_MP4) / (1024*1024):.2f} MB")
    if os.path.exists(TEMP_VIDEO):
        os.remove(TEMP_VIDEO)
else:
    print("Muxing failed:")
    print(res.stderr)
