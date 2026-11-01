import os
import wave
import struct
import numpy as np

base_dir = r"C:\Users\Karunesh P\OneDrive\Desktop\Hack\siloguard"
audio_dir = os.path.join(base_dir, "audio")
output_wav = os.path.join(base_dir, "merged_narration.wav")

SAMPLE_RATE = 44100
SCENE_DURATION = 64.0  # seconds per scene
NUM_SCENES = 9
TOTAL_DURATION = SCENE_DURATION * NUM_SCENES  # 576.0 seconds = 9 minutes 36 seconds
TOTAL_SAMPLES = int(TOTAL_DURATION * SAMPLE_RATE)

master_audio = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

print(f"Synthesizing 9-Scene Master Soundtrack: {TOTAL_DURATION}s ({TOTAL_DURATION/60:.2f} mins)...")

# 1. Place narration for each scene
for i in range(NUM_SCENES):
    scene_file = os.path.join(audio_dir, f"scene{i+1}.wav")
    with wave.open(scene_file, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)
        
        # Unpack based on sample width
        if sampwidth == 2:
            data = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 1:
            data = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128) / 128.0
        else:
            data = np.zeros(n_frames, dtype=np.float32)
            
        if n_channels > 1:
            data = data[::n_channels] # take mono
            
        # Resample to 44100 if needed
        if framerate != SAMPLE_RATE:
            num_resampled = int(len(data) * SAMPLE_RATE / framerate)
            indices = np.linspace(0, len(data) - 1, num_resampled)
            data = np.interp(indices, np.arange(len(data)), data)
            
        # Start offset within scene: 2.0s intro cushion
        scene_start_sec = i * SCENE_DURATION + 1.8
        start_idx = int(scene_start_sec * SAMPLE_RATE)
        end_idx = min(start_idx + len(data), TOTAL_SAMPLES)
        placed_len = end_idx - start_idx
        
        master_audio[start_idx:end_idx] += data[:placed_len]
        print(f"Scene {i+1} narration placed at {scene_start_sec:.1f}s - {(scene_start_sec + placed_len/SAMPLE_RATE):.1f}s")

# 2. Generate ambient background soundtrack (futuristic cyber pad)
t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)
# Subtle chord (A2 = 110Hz, E3 = 164.8Hz, C#3 = 138.6Hz)
pad1 = np.sin(2 * np.pi * 110.0 * t) * 0.025
pad2 = np.sin(2 * np.pi * 164.81 * t) * 0.018
pad3 = np.sin(2 * np.pi * 220.0 * t) * 0.015
# Low frequency ambient pulse (0.25 Hz rhythm)
pulse = (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * t)) * 0.015

ambient_track = pad1 + pad2 + pad3 + pulse

# Emergency sirens in Scene 5 (from t = 4 * 64 + 10 to 4 * 64 + 40)
siren_mask = (t >= (4 * SCENE_DURATION + 12)) & (t <= (4 * SCENE_DURATION + 44))
siren_freq = 650 + 250 * np.sin(2 * np.pi * 1.5 * t)
siren = np.sin(2 * np.pi * siren_freq * t) * 0.035 * siren_mask

# Blend ambient with master audio
total_mix = master_audio * 0.90 + ambient_track + siren

# Soft limiter / normalization to avoid clipping
max_peak = np.max(np.abs(total_mix))
if max_peak > 0.95:
    total_mix = (total_mix / max_peak) * 0.95

# Convert to 16-bit PCM stereo
pcm16 = (total_mix * 32767).astype(np.int16)
stereo_pcm = np.column_stack((pcm16, pcm16)).flatten()

with wave.open(output_wav, 'wb') as out_wf:
    out_wf.setnchannels(2)
    out_wf.setsampwidth(2)
    out_wf.setframerate(SAMPLE_RATE)
    out_wf.writeframes(stereo_pcm.tobytes())

print(f"SUCCESS: Wrote master audio file: {output_wav}")
print(f"Total Duration: {TOTAL_DURATION}s ({TOTAL_DURATION/60:.2f} mins), Size: {os.path.getsize(output_wav) / (1024*1024):.2f} MB")
