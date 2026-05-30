"""
RAG Chatbot Chain — LangChain-powered conversational AI for road queries.
Uses Groq (free, fast) with fallback to OpenAI.
Supports multilingual responses, location context, and streaming.
"""

from langchain.schema import HumanMessage, SystemMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, AsyncGenerator, Dict, Any
from loguru import logger
import json

from core.config import settings
from services.rag.vector_store import query_vector_store

# In-memory session store (use Redis in production)
_sessions: Dict[str, list] = {}

SYSTEM_PROMPT = """You are RoadWatch AI, an intelligent assistant for road transparency and accountability.

You help citizens:
1. Find information about road projects, contractors, and budgets
2. Understand who is responsible for roads in their area
3. Report road issues and track complaints
4. Understand budget allocations and spending
5. Identify suspicious spending patterns

You have access to a database of road projects, contractor details, complaint records, and budget information.

Guidelines:
- Always be factual and cite your sources
- If you don't have specific data, say so clearly
- For complaints, guide users to use the complaint form
- Provide jurisdiction-specific information when location is available
- Respond in the user's preferred language: {language}
- Country context: {country_code}
- User location: {location_context}

When answering about budgets, always mention:
- Amount sanctioned vs spent
- Whether any anomalies were detected
- The responsible authority

Context from database:
{context}
"""


def _get_llm(streaming: bool = False):
    """
    Returns the best available LLM.
    Priority: Groq (free) → OpenAI → None
    """
    # Try Groq first (free)
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model=settings.GROQ_MODEL,
                groq_api_key=settings.GROQ_API_KEY,
                temperature=0.3,
                streaming=streaming,
            )
        except Exception as e:
            logger.warning(f"Groq init failed: {e}")

    # Fallback to OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=settings.OPENAI_MODEL,
                openai_api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
                streaming=streaming,
            )
        except Exception as e:
            logger.warning(f"OpenAI init failed: {e}")

    return None


def get_or_create_session(session_id: str) -> list:
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]


async def get_chatbot_response(
    message: str,
    session_id: str,
    language: str = "en",
    country_code: str = "IN",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """Main RAG chatbot response."""
    # 1. Retrieve relevant docs
    filter_dict = {"country_code": country_code}
    docs = await query_vector_store(message, k=5, filter_dict=filter_dict)
    context = "\n\n".join([doc.page_content for doc in docs]) if docs else "No specific road data found."
    sources = [{"content": doc.page_content[:200], "metadata": doc.metadata} for doc in docs]

    location_context = f"Lat: {latitude:.4f}, Lon: {longitude:.4f}" if latitude else "Not provided"
    history = get_or_create_session(session_id)

    llm = _get_llm(streaming=False)
    if llm is None:
        return {"answer": _get_fallback_response(message, language), "sources": []}

    try:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(
                language=language,
                country_code=country_code,
                location_context=location_context,
                context=context,
            ))
        ]
        for turn in history[-6:]:
            messages.append(HumanMessage(content=turn["human"]))
            messages.append(AIMessage(content=turn["ai"]))
        messages.append(HumanMessage(content=message))

        response = await llm.ainvoke(messages)
        answer = response.content

        history.append({"human": message, "ai": answer})
        _sessions[session_id] = history

        return {"answer": answer, "sources": sources}

    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return {"answer": _get_fallback_response(message, language), "sources": []}


async def stream_chatbot_response(
    message: str,
    session_id: str,
    language: str = "en",
    country_code: str = "IN",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    db: Optional[AsyncSession] = None,
) -> AsyncGenerator[str, None]:
    """Streaming chatbot response."""
    docs = await query_vector_store(message, k=5)
    context = "\n\n".join([doc.page_content for doc in docs]) if docs else "No specific data found."
    location_context = f"Lat: {latitude}, Lon: {longitude}" if latitude else "Not provided"

    llm = _get_llm(streaming=True)
    if llm is None:
        yield _get_fallback_response(message, language)
        return

    try:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(
                language=language,
                country_code=country_code,
                location_context=location_context,
                context=context,
            )),
            HumanMessage(content=message),
        ]
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content
    except Exception as e:
        logger.error(f"Streaming LLM failed: {e}")
        yield _get_fallback_response(message, language)


def _get_fallback_response(message: str, language: str) -> str:
    responses = {
        "en": (
            "I'm currently unable to connect to the AI service. "
            "You can still:\n"
            "• Report a complaint using the form\n"
            "• Track your complaint by ticket number\n"
            "• View the transparency dashboard\n"
            "Please try again shortly."
        ),
        "hi": "मैं अभी AI सेवा से कनेक्ट नहीं हो पा रहा हूं। आप शिकायत दर्ज कर सकते हैं या डैशबोर्ड देख सकते हैं।",
    }
    return responses.get(language, responses["en"])
