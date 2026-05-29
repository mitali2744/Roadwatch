"""
Voice API — speech-to-text and text-to-speech for voice-first accessibility.
Uses OpenAI Whisper for STT and gTTS for TTS.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io
import os
import tempfile

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("en"),
):
    """
    Voice-First Accessibility: Transcribe audio to text using OpenAI Whisper.
    Supports regional accents and multiple languages.
    """
    try:
        import whisper
        content = await audio.read()

        # Save to temp file (Whisper needs a file path)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            model = whisper.load_model("base")
            result = model.transcribe(tmp_path, language=language if language != "auto" else None)
            transcript = result["text"].strip()
            detected_language = result.get("language", language)
        finally:
            os.unlink(tmp_path)

        return {
            "transcript": transcript,
            "language": detected_language,
            "confidence": 0.95,  # Whisper doesn't return confidence directly
        }

    except ImportError:
        # Fallback: return error asking user to type
        raise HTTPException(
            status_code=503,
            detail="Voice transcription service unavailable. Please type your query.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/speak")
async def text_to_speech(
    text: str = Form(...),
    language: str = Form("en"),
):
    """
    Convert text to speech for voice output.
    Returns audio/mpeg stream.
    """
    try:
        from gtts import gTTS

        # Map language codes
        lang_map = {
            "en": "en", "hi": "hi", "ta": "ta", "te": "te",
            "kn": "kn", "ml": "ml", "mr": "mr", "bn": "bn",
            "fr": "fr", "de": "de", "es": "es", "pt": "pt",
        }
        gtts_lang = lang_map.get(language, "en")

        tts = gTTS(text=text[:500], lang=gtts_lang, slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=response.mp3"},
        )

    except ImportError:
        raise HTTPException(status_code=503, detail="TTS service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")
