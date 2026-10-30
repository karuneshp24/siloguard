import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
import time

print("Starting SiloGuard MP4 Video Rendering...")

WIDTH = 1280
HEIGHT = 720
FPS = 24
OUTPUT_FILE = r"C:\Users\Karunesh P\OneDrive\Desktop\Hack\siloguard\SiloGuard_AI_Presentation.mp4"

scenes = [
    {
        "title": "THE INVISIBLE CRISIS",
        "subtitle": "Microscopic Heat Anomaly Multiplies Spores 72h Prior",
        "duration": 24,
        "color": (239, 68, 68),
        "theme": "crisis"
    },
    {
        "title": "75-VOXEL 3D DIGITAL TWIN",
        "subtitle": "Multi-Depth Telemetry: Surface, Mid, and Deep Core Zones",
        "duration": 24,
        "color": (52, 211, 153),
        "theme": "twin"
    },
    {
        "title": "PREDICTIVE AI CRISIS INTERCEPT",
        "subtitle": "2-Minute Emergency Countdown & Turbo Aeration Fans Engaged",
        "duration": 21,
        "color": (239, 68, 68),
        "theme": "emergency"
    },
    {
        "title": "FARMER OMNI-CHANNEL DISPATCH",
        "subtitle": "Target: +91 8220480281 | WhatsApp, SMS, Push & Dynamic Auction",
        "duration": 23,
        "color": (56, 189, 248),
        "theme": "farmer"
    },
    {
        "title": "40% CIRCULAR BIOFUEL FACILITY",
        "subtitle": "Anaerobic Digester: 74.2% Pure Methane & 418 kW Electricity",
        "duration": 23,
        "color": (6, 182, 212),
        "theme": "biofuel"
    },
    {
        "title": "THE UNIFIED AGRITECH REVOLUTION",
        "subtitle": "60% Food Grain Preserved | 40% Clean Energy Valorized",
        "duration": 13,
        "color": (52, 211, 153),
        "theme": "outro"
    }
]

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT_FILE, fourcc, FPS, (WIDTH, HEIGHT))

total_frames = sum(s["duration"] * FPS for s in scenes)
frame_count = 0
start_time = time.time()

# Try loading system font, fallback to default
try:
    font_large = ImageFont.truetype("arialbd.ttf", 46)
    font_mid = ImageFont.truetype("arial.ttf", 26)
    font_small = ImageFont.truetype("arialbd.ttf", 18)
    font_hud = ImageFont.truetype("consola.ttf", 18)
except:
    font_large = font_mid = font_small = font_hud = ImageFont.load_default()

for scene_idx, scene in enumerate(scenes):
    scene_frames = scene["duration"] * FPS
    print(f"Rendering Scene {scene_idx + 1}/6: {scene['title']} ({scene_frames} frames)...")
    
    for f in range(scene_frames):
        t = f / FPS
        # Create base canvas
        img = Image.new("RGB", (WIDTH, HEIGHT), color=(6, 10, 18))
        draw = ImageDraw.Draw(img)
        
        # Cyber grid lines
        for y in range(0, HEIGHT, 60):
            draw.line([(0, y), (WIDTH, y)], fill=(15, 23, 42), width=1)
        for x in range(0, WIDTH, 60):
            draw.line([(x, 0), (x, HEIGHT)], fill=(15, 23, 42), width=1)

        # Border HUD Box
        draw.rectangle([30, 30, WIDTH - 30, HEIGHT - 30], outline=(52, 211, 153), width=2)
        # Corners
        c_len = 20
        draw.line([(30, 30), (30 + c_len, 30)], fill=(52, 211, 153), width=4)
        draw.line([(30, 30), (30, 30 + c_len)], fill=(52, 211, 153), width=4)
        draw.line([(WIDTH - 30, 30), (WIDTH - 30 - c_len, 30)], fill=(52, 211, 153), width=4)
        draw.line([(WIDTH - 30, 30), (WIDTH - 30, 30 + c_len)], fill=(52, 211, 153), width=4)

        # Header HUD
        draw.text((50, 50), "● SILOGUARD AI DASHBOARD · 1Hz REAL-TIME TELEMETRY", fill=(52, 211, 153), font=font_hud)
        draw.text((WIDTH - 280, 50), f"TICK {frame_count + 10420} | 75 VOXELS", fill=(56, 189, 248), font=font_hud)

        # Scene Tag
        draw.rectangle([50, 95, 340, 128], fill=(30, 41, 59), outline=scene["color"], width=1)
        draw.text((65, 102), f"SCENE {scene_idx + 1} OF 6 · ACTIVE", fill=scene["color"], font=font_small)

        # Scene Title & Subtitle
        draw.text((50, 150), scene["title"], fill=(255, 255, 255), font=font_large)
        draw.text((50, 210), scene["subtitle"], fill=(148, 163, 184), font=font_mid)

        # Scene Visual Elements
        if scene["theme"] == "crisis":
            # Draw Silo with Hotspot
            draw.rectangle([WIDTH//2 - 120, 280, WIDTH//2 + 120, 560], fill=(180, 83, 9), outline=(255, 255, 255), width=2)
            pulse = int(25 + 15 * np.sin(t * 6))
            draw.ellipse([WIDTH//2 - pulse, 420 - pulse, WIDTH//2 + pulse, 420 + pulse], fill=(239, 68, 68))
            draw.text((WIDTH//2 + 160, 380), "⚠️ Deep Core Hotspot: 43.8°C", fill=(239, 68, 68), font=font_mid)
            draw.text((WIDTH//2 + 160, 420), "Spore Multiplication Detected", fill=(254, 202, 202), font=font_small)
            draw.text((WIDTH//2 + 160, 450), "Safe Storage S_rem Falling Rapidly", fill=(254, 202, 202), font=font_small)

        elif scene["theme"] == "twin":
            # Draw 75 Voxel Grid (3 layers)
            for lay in range(3):
                y_base = 300 + lay * 80
                col_c = (52, 211, 153) if lay == 0 else ((245, 158, 11) if lay == 1 else (239, 68, 68))
                draw.text((WIDTH//2 - 240, y_base - 22), f"LAYER {lay+1}: {'SURFACE' if lay==0 else ('MID' if lay==1 else 'DEEP CORE')}", fill=col_c, font=font_small)
                for c in range(10):
                    x_box = WIDTH//2 - 240 + c * 48
                    box_color = col_c if (lay != 2 or c != 5) else (255, 255, 255)
                    draw.rectangle([x_box, y_base, x_box + 38, y_base + 38], fill=box_color, outline=(255, 255, 255), width=1)
            draw.text((WIDTH//2 + 270, 360), "[-] [82%] [+] [FIT]", fill=(52, 211, 153), font=font_large)
            draw.text((WIDTH//2 + 270, 430), "Proportional Centered Zoom", fill=(148, 163, 184), font=font_small)

        elif scene["theme"] == "emergency":
            # Emergency Countdown & Equations
            draw.rectangle([WIDTH//2 - 380, 290, WIDTH//2 + 380, 560], fill=(24, 10, 15), outline=(239, 68, 68), width=3)
            draw.text((WIDTH//2 - 340, 315), "🚨 2-MINUTE THERMAL RUNAWAY COUNTDOWN: ACTIVE", fill=(239, 68, 68), font=font_mid)
            draw.text((WIDTH//2 - 340, 370), "Af = 5.42x Exponential", fill=(56, 189, 248), font=font_large)
            draw.text((WIDTH//2 - 340, 430), "S_rem = 22.8 Hours Left", fill=(239, 68, 68), font=font_large)
            draw.text((WIDTH//2 - 340, 500), "✔ Turbo Aeration Fans Engaged | Voice Broadcast: EN / TA / HI", fill=(52, 211, 153), font=font_small)

        elif scene["theme"] == "farmer":
            # WhatsApp Card & SMS
            draw.rectangle([WIDTH//2 - 360, 290, WIDTH//2 + 360, 560], fill=(15, 23, 42), outline=(56, 189, 248), width=3)
            draw.text((WIDTH//2 - 320, 315), "🟢 WhatsApp Farmer Emergency Alert (+91 8220480281)", fill=(34, 197, 94), font=font_mid)
            draw.text((WIDTH//2 - 320, 370), "Silo #4 Spike: Core 43.8°C | 22.8h Remaining", fill=(255, 255, 255), font=font_mid)
            draw.text((WIDTH//2 - 320, 415), "40% Grain Diverted to Biofuel Power Plant", fill=(6, 182, 212), font=font_small)
            draw.text((WIDTH//2 - 320, 455), "💬 Cellular SMS & High-Priority Push Dispatched", fill=(56, 189, 248), font=font_small)
            draw.text((WIDTH//2 - 320, 500), "⚖️ Dynamic Flash Auction: 35% Discount Dispatched to Mills", fill=(245, 158, 11), font=font_small)

        elif scene["theme"] == "biofuel":
            # Biofuel dials
            draw.text((WIDTH//2 - 280, 330), "74.2% CH4", fill=(6, 182, 212), font=font_large)
            draw.text((WIDTH//2 - 280, 390), "METHANE PURITY", fill=(148, 163, 184), font=font_small)
            draw.text((WIDTH//2 + 100, 330), "418 kW", fill=(52, 211, 153), font=font_large)
            draw.text((WIDTH//2 + 100, 390), "CLEAN ELECTRIC POWER", fill=(148, 163, 184), font=font_small)
            draw.text((WIDTH//2 - 220, 470), "⚡ Anaerobic Digester Running · Closed-Loop Value Recovery", fill=(255, 255, 255), font=font_mid)

        elif scene["theme"] == "outro":
            draw.rectangle([WIDTH//2 - 360, 290, WIDTH//2 - 20, 450], fill=(16, 185, 129), outline=(255, 255, 255), width=2)
            draw.text((WIDTH//2 - 290, 330), "60%", fill=(4, 20, 14), font=font_large)
            draw.text((WIDTH//2 - 320, 395), "Food Grain Preserved", fill=(4, 20, 14), font=font_mid)

            draw.rectangle([WIDTH//2 + 20, 290, WIDTH//2 + 360, 450], fill=(6, 182, 212), outline=(255, 255, 255), width=2)
            draw.text((WIDTH//2 + 90, 330), "40%", fill=(2, 21, 29), font=font_large)
            draw.text((WIDTH//2 + 60, 395), "Clean Bio-Energy", fill=(2, 21, 29), font=font_mid)

            draw.text((WIDTH//2 - 200, 490), "github.com/karuneshp24/siloguard", fill=(255, 255, 255), font=font_mid)

        # Bottom Subtitle Box
        sub_box_y = HEIGHT - 105
        draw.rectangle([50, sub_box_y, WIDTH - 50, sub_box_y + 60], fill=(2, 6, 18), outline=(52, 211, 153), width=1)
        sub_text = scene["subtitle"]
        draw.text((70, sub_box_y + 16), sub_text, fill=(255, 255, 255), font=font_small)

        # Convert to OpenCV BGR frame
        frame_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        out.write(frame_bgr)
        frame_count += 1

out.release()
duration_sec = time.time() - start_time
print(f"SUCCESS: Rendered {frame_count} frames in {duration_sec:.1f}s!")
print(f"Video saved to: {OUTPUT_FILE}")
