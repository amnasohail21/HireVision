import ffmpeg

def extract_audio_from_video(video_path, output_audio_path):
    (
        ffmpeg
        .input(video_path)
        .output(output_audio_path, format='mp3', ac=1, ar='16000')
        .run(overwrite_output=True)
    )
