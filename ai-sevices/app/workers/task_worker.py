import asyncio
import time
from datetime import datetime
from typing import Dict, Any
from sqlalchemy import select
from app.core.logging import logger
from app.db.session import AsyncSessionLocal
from app.db.models import (
    PracticeSession,
    AudioFile,
    Transcript,
    SpeechMetric,
    AiFeedback,
)
from app.services.speech_engine import transcribe_audio
from app.services.analytics_engine import analyze_speech_data
from app.services.language_engine import detect_hybrid_language
from app.services.coach_engine import generate_ai_coaching
from app.services.confidence_engine import calculate_deterministic_confidence
from app.workers.queue import dequeue_task

TASK_QUEUE_NAME = "confidence_speech_queue"


async def process_speech_session(session_id: str):
    """
    Asynchronous state machine executing the complete Confidence Intelligence pipeline:
    uploaded -> transcribing -> analyzing -> coaching -> completed
    """
    start_time = time.time()
    logger.info(f"Starting processing for session {session_id}")
    
    async with AsyncSessionLocal() as db:
        stmt = select(PracticeSession).where(PracticeSession.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        
        if not session:
            logger.error(f"Session {session_id} not found in database.")
            return
            
        stmt_audio = select(AudioFile).where(AudioFile.session_id == session_id)
        res_audio = await db.execute(stmt_audio)
        audio = res_audio.scalar_one_or_none()
        
        if not audio:
            session.status = "failed"
            session.error_message = "Audio file record not found"
            await db.commit()
            return
            
        try:
            # 1. STAGE: Transcribing (Whisper)
            session.status = "transcribing"
            session.status_stage = "Transcribing speech audio with Whisper"
            session.progress_percent = 25
            await db.commit()
            
            whisper_result = transcribe_audio(audio.file_path)
            transcript_text = whisper_result.get("transcript", "")
            duration_sec = whisper_result.get("duration_seconds", audio.duration_seconds or 10.0)
            segments = whisper_result.get("segments", [])
            whisper_lang = whisper_result.get("language", "en")
            whisper_prob = whisper_result.get("language_probability", 0.9)
            
            # Save/Update Transcript
            t_stmt = select(Transcript).where(Transcript.session_id == session_id)
            res_t = await db.execute(t_stmt)
            transcript_record = res_t.scalar_one_or_none()
            if not transcript_record:
                transcript_record = Transcript(
                    session_id=session_id,
                    raw_text=transcript_text,
                    cleaned_text=transcript_text,
                    whisper_language=whisper_lang,
                    whisper_confidence=whisper_prob,
                    segments=segments,
                )
                db.add(transcript_record)
            else:
                transcript_record.raw_text = transcript_text
                transcript_record.cleaned_text = transcript_text
                transcript_record.segments = segments
            await db.commit()
            
            # 2. STAGE: Analyzing (Deterministic Python NLP + Audio metrics)
            session.status = "analyzing"
            session.status_stage = "Computing speech metrics, pauses, and vocabulary"
            session.progress_percent = 50
            await db.commit()
            
            metrics = analyze_speech_data(
                transcript=transcript_text,
                duration_seconds=duration_sec,
                audio_path=audio.file_path,
                segments=segments
            )
            
            # Hybrid Language Detection
            lang_detection = await detect_hybrid_language(
                transcript=transcript_text,
                user_preferred_languages=["English", "Urdu"],
                whisper_language=whisper_lang
            )
            
            transcript_record.primary_language = lang_detection["primary_language"]
            transcript_record.language_label = lang_detection["language_label"]
            transcript_record.is_mixed_language = lang_detection["is_mixed"]
            transcript_record.language_distribution = lang_detection["distribution"]
            
            # Save Speech Metrics
            m_stmt = select(SpeechMetric).where(SpeechMetric.session_id == session_id)
            res_m = await db.execute(m_stmt)
            metric_record = res_m.scalar_one_or_none()
            if not metric_record:
                metric_record = SpeechMetric(session_id=session_id)
                db.add(metric_record)
                
            for k, v in metrics.items():
                if hasattr(metric_record, k):
                    setattr(metric_record, k, v)
            await db.commit()
            
            # 3. STAGE: Coaching (Ollama / Gemini / Fallback Rule Coach)
            session.status = "coaching"
            session.status_stage = "Generating personalized AI coaching feedback"
            session.progress_percent = 75
            await db.commit()
            
            topic_str = session.topic or "Introduce yourself"
            coaching_output, provider, model_name = await generate_ai_coaching(
                topic=topic_str,
                transcript=transcript_text,
                language_label=lang_detection["language_label"],
                metrics=metrics
            )
            
            # Save AI Feedback
            f_stmt = select(AiFeedback).where(AiFeedback.session_id == session_id)
            res_f = await db.execute(f_stmt)
            feedback_record = res_f.scalar_one_or_none()
            if not feedback_record:
                feedback_record = AiFeedback(session_id=session_id)
                db.add(feedback_record)
                
            feedback_record.provider = provider
            feedback_record.model = model_name
            feedback_record.topic_relevance = coaching_output.topic_relevance
            feedback_record.topic_coverage_percent = coaching_output.topic_coverage_percent
            feedback_record.missing_points = coaching_output.missing_points
            feedback_record.strengths = coaching_output.strengths
            feedback_record.weaknesses = coaching_output.weaknesses
            feedback_record.coaching_feedback = coaching_output.coaching_feedback
            feedback_record.personalized_suggestions = coaching_output.personalized_suggestions
            feedback_record.next_mission = coaching_output.next_mission
            feedback_record.coach_message = coaching_output.coach_message
            feedback_record.emotional_tone = coaching_output.emotional_tone
            await db.commit()
            
            # 4. STAGE: Calculating Deterministic Confidence Score (v1.0)
            overall_score, components, xp_earned = calculate_deterministic_confidence(
                metrics=metrics,
                topic_relevance_score=coaching_output.topic_relevance,
                current_streak=1,
                sessions_last_7_days=1,
                previous_score=None
            )
            
            # 5. STAGE: Completed
            processing_time_ms = int((time.time() - start_time) * 1000)
            session.overall_confidence_score = overall_score
            session.fluency_score = components.speech_fluency
            session.topic_relevance_score = components.topic_relevance
            session.vocabulary_score = components.vocabulary
            session.consistency_score = components.practice_consistency
            session.confidence_engine_version = "1.0"
            session.xp_earned = xp_earned
            session.duration_seconds = duration_sec
            session.processing_time_ms = processing_time_ms
            session.completed_at = datetime.utcnow()
            
            session.status = "completed"
            session.status_stage = "Results ready"
            session.progress_percent = 100
            session.error_message = None
            await db.commit()
            
            logger.info(f"Session {session_id} completed successfully in {processing_time_ms}ms with Confidence Score: {overall_score}")
            
        except Exception as e:
            logger.error(f"Error processing session {session_id}: {str(e)}", exc_info=True)
            session.status = "failed"
            session.status_stage = "Processing failed"
            session.error_message = str(e)
            await db.commit()


async def run_worker_loop():
    """Worker background consumer loop polling tasks from the queue."""
    logger.info(f"AI Worker listening for tasks on queue '{TASK_QUEUE_NAME}'...")
    while True:
        try:
            task = await dequeue_task(TASK_QUEUE_NAME, timeout=2)
            if task:
                session_id = task.get("session_id")
                if session_id:
                    await process_speech_session(session_id)
            else:
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker loop error: {str(e)}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    from app.core.logging import setup_logging
    setup_logging()
    asyncio.run(run_worker_loop())
