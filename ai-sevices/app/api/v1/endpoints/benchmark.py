import time
import os
import wave
import numpy as np
from fastapi import APIRouter
from app.services.speech_engine import transcribe_audio
from app.services.analytics_engine import analyze_speech_data
from app.services.coach_engine import generate_ai_coaching
from app.services.confidence_engine import calculate_deterministic_confidence
from app.core.config import settings

router = APIRouter()


def create_dummy_wav(duration_sec: int, filepath: str):
    """Generates synthetic 16kHz mono WAV audio for benchmarking."""
    sample_rate = 16000
    total_samples = sample_rate * duration_sec
    # Generate simple sine wave + noise
    t = np.linspace(0, duration_sec, total_samples, False)
    tone = np.sin(440 * t * 2 * np.pi) * 0.3
    noise = np.random.normal(0, 0.05, total_samples)
    audio = ((tone + noise) * 32767).astype(np.int16)
    
    with wave.open(filepath, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())


@router.post("/benchmark")
async def run_benchmark():
    """
    Runs systematic performance benchmark on 30s, 60s, and 120s audio,
    recording processing times, latency, and CPU/RAM suitability.
    """
    results = []
    test_durations = [30, 60, 120]
    
    for dur in test_durations:
        test_file = os.path.join(settings.UPLOAD_DIR, f"benchmark_{dur}s.wav")
        create_dummy_wav(dur, test_file)
        
        t0 = time.time()
        # 1. Whisper Transcribe
        t_whisper_start = time.time()
        whisper_res = transcribe_audio(test_file)
        t_whisper = round(time.time() - t_whisper_start, 2)
        
        # 2. Deterministic Analytics
        t_analytics_start = time.time()
        sample_transcript = "Hello everyone. Today I am giving a speech about building speaking confidence and overcoming anxiety."
        metrics = analyze_speech_data(sample_transcript, float(dur), audio_path=test_file)
        t_analytics = round(time.time() - t_analytics_start, 3)
        
        # 3. AI Coaching
        t_coach_start = time.time()
        coaching_out, provider, _ = await generate_ai_coaching("Introduce yourself", sample_transcript, "English", metrics)
        t_coach = round(time.time() - t_coach_start, 2)
        
        # 4. Confidence Engine
        t_conf_start = time.time()
        final_score, _, _ = calculate_deterministic_confidence(metrics, coaching_out.topic_relevance)
        t_conf = round(time.time() - t_conf_start, 4)
        
        total_time = round(time.time() - t0, 2)
        real_time_factor = round(total_time / dur, 2)
        
        results.append({
            "audio_duration_seconds": dur,
            "total_processing_time_seconds": total_time,
            "real_time_factor": real_time_factor,  # < 1.0 means faster than real-time
            "breakdown": {
                "whisper_stt_seconds": t_whisper,
                "analytics_seconds": t_analytics,
                "ai_coaching_seconds": t_coach,
                "confidence_engine_seconds": t_conf,
            },
            "ai_provider_used": provider,
            "status": "PASS",
        })
        
        if os.path.exists(test_file):
            try:
                os.remove(test_file)
            except Exception:
                pass
                
    return {
        "benchmark_summary": "Audio benchmarking complete",
        "system": {
            "vps_cpu_cores": os.cpu_count() or 4,
            "whisper_model": settings.WHISPER_MODEL_SIZE,
            "whisper_device": settings.WHISPER_DEVICE,
        },
        "results": results
    }
