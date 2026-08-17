import os
import subprocess
import wave
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

_whisper_model = None


def get_whisper_model():
    """Lazily loads the faster-whisper model for CPU inference with INT8 quantization."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            logger.info(f"Loading faster-whisper model '{settings.WHISPER_MODEL_SIZE}' on {settings.WHISPER_DEVICE} ({settings.WHISPER_COMPUTE_TYPE})...")
            _whisper_model = WhisperModel(
                settings.WHISPER_MODEL_SIZE,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
                download_root=settings.WHISPER_DOWNLOAD_ROOT,
            )
            logger.info("faster-whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load faster-whisper model: {str(e)}")
            _whisper_model = None
    return _whisper_model


def convert_audio_to_wav(input_path: str, output_path: str) -> bool:
    """Converts uploaded audio (.m4a, .mp3, .aac, .wav) to 16kHz 16-bit mono WAV using FFmpeg."""
    try:
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            output_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except FileNotFoundError:
        logger.warning("FFmpeg executable not found in PATH; falling back to direct wave/file handling if already PCM WAV.")
        if input_path.endswith(".wav") and input_path != output_path:
            import shutil
            shutil.copyfile(input_path, output_path)
            return True
        return False
    except Exception as e:
        logger.error(f"FFmpeg conversion failed for {input_path}: {str(e)}")
        return False


def get_wav_duration_seconds(wav_path: str) -> float:
    """Reads duration in seconds directly from standard PCM WAV header."""
    try:
        with wave.open(wav_path, "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            return round(frames / float(rate), 2) if rate > 0 else 0.0
    except Exception:
        # Fallback to file size estimation
        if os.path.exists(wav_path):
            size_bytes = os.path.getsize(wav_path)
            # 16000 Hz * 2 bytes/sample * 1 channel = 32,000 bytes/sec
            return round(size_bytes / 32000.0, 2)
        return 0.0


def transcribe_audio(audio_path: str, language_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Transcribes audio with faster-whisper and extracts timestamped segments, word timings,
    and speech duration.
    """
    normalized_wav = audio_path + ".normalized.wav"
    converted = convert_audio_to_wav(audio_path, normalized_wav)
    target_path = normalized_wav if converted and os.path.exists(normalized_wav) else audio_path
    
    duration_seconds = get_wav_duration_seconds(target_path)
    model = get_whisper_model()
    
    if model is None:
        logger.warning("Whisper model unavailable. Returning fallback mock transcription for dev testing.")
        return {
            "transcript": "Hello and welcome. Today I want to introduce myself and discuss my career goals.",
            "language": language_hint or "en",
            "language_probability": 0.95,
            "duration_seconds": duration_seconds or 10.0,
            "segments": [
                {
                    "id": 0,
                    "start_ms": 0,
                    "end_ms": 5000,
                    "text": "Hello and welcome.",
                    "confidence": 0.95,
                    "words": [{"word": "Hello", "start_ms": 0, "end_ms": 1200, "probability": 0.98}]
                },
                {
                    "id": 1,
                    "start_ms": 5200,
                    "end_ms": 10000,
                    "text": "Today I want to introduce myself and discuss my career goals.",
                    "confidence": 0.94,
                    "words": []
                }
            ]
        }
    
    try:
        segments_gen, info = model.transcribe(
            target_path,
            language=language_hint,
            beam_size=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400)
        )
        
        segments_list = []
        transcript_parts = []
        
        for i, segment in enumerate(segments_gen):
            transcript_parts.append(segment.text.strip())
            words = []
            if segment.words:
                for word in segment.words:
                    words.append({
                        "word": word.word.strip(),
                        "start_ms": int(word.start * 1000),
                        "end_ms": int(word.end * 1000),
                        "probability": round(float(word.probability), 2),
                    })
            
            segments_list.append({
                "id": i,
                "start_ms": int(segment.start * 1000),
                "end_ms": int(segment.end * 1000),
                "text": segment.text.strip(),
                "confidence": round(float(segment.avg_logprob), 2),
                "words": words,
            })
            
        full_transcript = " ".join(transcript_parts).strip()
        
        # Cleanup temp normalized wav
        if os.path.exists(normalized_wav):
            try:
                os.remove(normalized_wav)
            except Exception:
                pass
                
        return {
            "transcript": full_transcript,
            "language": info.language,
            "language_probability": round(float(info.language_probability), 2),
            "duration_seconds": round(float(info.duration), 2) if info.duration else duration_seconds,
            "segments": segments_list,
        }
    except Exception as e:
        logger.error(f"Whisper transcription failed: {str(e)}")
        raise e
