"""
AI Chatbot API — RAG-powered conversational interface for road queries.
Supports multilingual responses and jurisdiction-aware answers.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import json

from db.database import get_db
from services.rag.chatbot_chain import get_chatbot_response, stream_chatbot_response
from services.rag.vector_store import query_vector_store

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
    """
    Main chatbot endpoint.
    Uses RAG over road data, project records, and complaint history.
    Supports multilingual responses and location-aware context.
    
    Example questions:
    - "Who is responsible for NH-48 near Bangalore?"
    - "What is the budget for road repairs in my area?"
    - "How do I report a pothole?"
    - "What is the status of my complaint RW-2026-ABC123?"
    - "Which contractor built the road near me?"
    """
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
    """
    Streaming chatbot endpoint — returns tokens as they are generated.
    Use for real-time typing effect in the UI.
    """
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


@router.get("/suggestions")
async def get_suggestions(
    country_code: str = "IN",
    language: str = "en",
):
    """Returns suggested questions for the chatbot UI."""
    suggestions = {
        "en": [
            "Who is responsible for the road near me?",
            "What is the budget for road repairs in my area?",
            "How do I report a pothole?",
            "Show me contractor details for NH-48",
            "Which roads are predicted to deteriorate soon?",
            "What is the status of complaint RW-2026-XXXXX?",
            "Show me budget anomalies in my district",
            "How transparent is road spending in my state?",
        ],
        "hi": [
            "मेरे पास की सड़क के लिए कौन जिम्मेदार है?",
            "मेरे क्षेत्र में सड़क मरम्मत का बजट क्या है?",
            "गड्ढे की शिकायत कैसे करें?",
            "NH-48 के ठेकेदार का विवरण दिखाएं",
        ],
    }
    return {"suggestions": suggestions.get(language, suggestions["en"])}
