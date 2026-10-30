import os
import wave
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
base_dir = r"C:\Users\Karunesh P\OneDrive\Desktop\Hack\siloguard"
audio_dir = os.path.join(base_dir, "audio")
temp_video = os.path.join(base_dir, "temp_video.mp4")
final_mp4 = os.path.join(base_dir, "SiloGuard_AI_Presentation.mp4")
merged_audio = os.path.join(base_dir, "merged_narration.wav")

scenes = ["scene1.wav", "scene2.wav", "scene3.wav", "scene4.wav", "scene5.wav", "scene6.wav"]

# Let's inspect audio specs
audio_files = [os.path.join(audio_dir, s) for s in scenes]

# Create an ffmpeg concat list file
concat_txt = os.path.join(base_dir, "concat_audio.txt")
with open(concat_txt, "w", encoding="utf-8") as f:
    for af in audio_files:
        escaped = af.replace("\\", "/")
        f.write(f"file '{escaped}'\n")

print("Merging audio files using FFmpeg...")
cmd_merge_audio = [
    ffmpeg_exe, "-y", "-f", "concat", "-safe", "0", "-i", concat_txt,
    "-c:a", "pcm_s16le", merged_audio
]
subprocess.run(cmd_merge_audio, check=True)
print(f"Merged audio created: {merged_audio}")

# Now rename existing MP4 or use it as video stream
raw_video = os.path.join(base_dir, "SiloGuard_AI_Presentation.mp4")
if os.path.exists(raw_video):
    if os.path.exists(temp_video):
        os.remove(temp_video)
    os.rename(raw_video, temp_video)

# Now encode video with libx264 (yuv420p) + AAC audio track into final_mp4
print("Muxing video with narration audio track...")
cmd_mux = [
    ffmpeg_exe, "-y",
    "-i", temp_video,
    "-i", merged_audio,
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    final_mp4
]
subprocess.run(cmd_mux, check=True)

# Clean up temp
if os.path.exists(temp_video):
    os.remove(temp_video)
if os.path.exists(concat_txt):
    os.remove(concat_txt)

file_size = os.path.getsize(final_mp4)
print(f"SUCCESS! Final MP4 with Audio Generated: {final_mp4}")
print(f"File Size: {file_size / (1024*1024):.2f} MB")
