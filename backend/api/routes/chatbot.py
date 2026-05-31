"""
AI Chatbot API — RAG-powered conversational interface for road queries.
Supports multilingual responses and jurisdiction-aware answers.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import json

from db.database import get_db
from services.rag.chatbot_chain import get_chatbot_response, stream_chatbot_response

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: Optional[str] = "en"
    country_code: Optional[str] = "IN"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ChatResponse(BaseModel):
    answer: str
    sources: list
    session_id: str
    language: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Main chatbot endpoint using RAG + Groq Llama 3."""
    import uuid
    session_id = request.session_id or str(uuid.uuid4())

    result = await get_chatbot_response(
        message=request.message,
        session_id=session_id,
        language=request.language,
        country_code=request.country_code,
        latitude=request.latitude,
        longitude=request.longitude,
        db=db,
    )

    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "session_id": session_id,
        "language": request.language,
    }


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Streaming chatbot — returns tokens as they are generated."""
    import uuid
    session_id = request.session_id or str(uuid.uuid4())

    async def generate() -> AsyncGenerator[str, None]:
        async for chunk in stream_chatbot_response(
            message=request.message,
            session_id=session_id,
            language=request.language,
            country_code=request.country_code,
            latitude=request.latitude,
            longitude=request.longitude,
            db=db,
        ):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/debug")
async def debug_llm():
    """Debug endpoint — checks if LLM is configured correctly."""
    from core.config import settings
    from services.rag.chatbot_chain import _get_llm

    groq_key_set = bool(settings.GROQ_API_KEY)
    groq_key_preview = settings.GROQ_API_KEY[:8] + "..." if settings.GROQ_API_KEY else "NOT SET"

    llm_status = "none"
    llm_error = None

    if groq_key_set:
        try:
            llm = _get_llm(streaming=False)
            if llm:
                from langchain.schema import HumanMessage
                response = await llm.ainvoke([HumanMessage(content="Say OK")])
                llm_status = f"groq_working: {response.content[:50]}"
            else:
                llm_status = "llm_object_is_none"
        except Exception as e:
            llm_status = "groq_error"
            llm_error = str(e)

    return {
        "groq_key_set": groq_key_set,
        "groq_key_preview": groq_key_preview,
        "groq_model": settings.GROQ_MODEL,
        "llm_status": llm_status,
        "llm_error": llm_error,
    }


@router.get("/suggestions")
async def get_suggestions(country_code: str = "IN", language: str = "en"):
    """Returns suggested questions for the chatbot UI."""
    suggestions = {
        "en": [
            "Who is responsible for the road near me?",
            "What is the budget for road repairs in my area?",
            "How do I report a pothole?",
            "Which roads are predicted to deteriorate soon?",
            "Show me budget anomalies in my district",
        ],
        "hi": [
            "मेरे पास की सड़क के लिए कौन जिम्मेदार है?",
            "मेरे क्षेत्र में सड़क मरम्मत का बजट क्या है?",
            "गड्ढे की शिकायत कैसे करें?",
        ],
    }
    return {"suggestions": suggestions.get(language, suggestions["en"])}
