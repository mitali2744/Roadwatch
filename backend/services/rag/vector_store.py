"""
Vector Store — ChromaDB-backed document store for RAG.
Indexes road projects, contractor data, and complaint summaries.
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from typing import List, Optional
from loguru import logger

from core.config import settings

# Global vector store instance
_vector_store: Optional[Chroma] = None
_chroma_client: Optional[chromadb.HttpClient] = None


async def init_vector_store():
    """Initialize ChromaDB connection and embeddings on startup."""
    global _vector_store, _chroma_client

    try:
        _chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )

        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )

        _vector_store = Chroma(
            client=_chroma_client,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
        )

        logger.info("✅ Vector store (ChromaDB) initialized")

    except Exception as e:
        logger.warning(f"⚠️ Vector store init failed (will use fallback): {e}")
        _vector_store = None


def get_vector_store() -> Optional[Chroma]:
    return _vector_store


async def add_documents(documents: List[Document]):
    """Add documents to the vector store."""
    if _vector_store is None:
        logger.warning("Vector store not available, skipping document indexing")
        return
    _vector_store.add_documents(documents)
    logger.info(f"Added {len(documents)} documents to vector store")


async def query_vector_store(
    query: str,
    k: int = 5,
    filter_dict: Optional[dict] = None,
) -> List[Document]:
    """Query the vector store for relevant documents."""
    if _vector_store is None:
        return []
    try:
        results = _vector_store.similarity_search(
            query,
            k=k,
            filter=filter_dict,
        )
        return results
    except Exception as e:
        logger.error(f"Vector store query failed: {e}")
        return []


async def index_road_project(project_data: dict):
    """Index a road project into the vector store for RAG."""
    doc = Document(
        page_content=f"""
Road Project: {project_data.get('title', '')}
Road: {project_data.get('road_name', '')} ({project_data.get('road_type', '')})
Contractor: {project_data.get('contractor_name', '')}
Authority: {project_data.get('authority_name', '')}
Budget Sanctioned: {project_data.get('currency', 'INR')} {project_data.get('budget_sanctioned', 0):,.0f}
Budget Spent: {project_data.get('currency', 'INR')} {project_data.get('budget_spent', 0):,.0f}
Status: {project_data.get('status', '')}
Last Relaying: {project_data.get('last_relaying_date', 'N/A')}
Location: {project_data.get('state', '')}, {project_data.get('country_code', '')}
        """.strip(),
        metadata={
            "type": "road_project",
            "project_id": project_data.get("id", ""),
            "country_code": project_data.get("country_code", "IN"),
            "road_type": project_data.get("road_type", ""),
        },
    )
    await add_documents([doc])
