"""
Legal Database Router
O'zbekiston qonunchilik ma'lumotlar bazasi
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.legal_database_service import LegalDatabaseService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, LegalDocument, AnalysisStatus

router = APIRouter(prefix="/legal/database", tags=["Legal Database"])
security_scheme = HTTPBearer()

# Pydantic modellar
class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    document_type: Optional[str] = None
    limit: int = 20
    offset: int = 0
    filters: Optional[Dict[str, Any]] = {}

class LegalArticle(BaseModel):
    id: str
    title: str
    content: str
    category: str
    document_type: str
    article_number: str
    chapter: str
    section: Optional[str] = None
    keywords: List[str]
    last_updated: str
    relevance_score: float

class SearchResult(BaseModel):
    articles: List[LegalArticle]
    total: int
    query: str
    search_time: float
    suggestions: List[str]

class DocumentRequest(BaseModel):
    document_id: str
    include_related: bool = False
    include_references: bool = True

# Dependency: Current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    """Joriy foydalanuvchini olish"""
    try:
        payload = security.verify_token(credentials.credentials)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        db = get_db_session()
        user = db.query(User).filter(User.id == payload.get("sub")).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

@router.post("/search", response_model=SearchResult)
async def search_legal_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Qonun hujjatlarida qidiruv
    
    - **query**: Qidiruv so'zi
    - **category**: Kategoriya (ixtiyoriy)
    - **document_type**: Hujjat turi (ixtiyoriy)
    - **limit**: Natijalar soni
    - **offset**: Offset
    - **filters**: Qo'shimcha filterlar
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "legal_database:search"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Qonunlar bazasidan qidirishga ruxsat yo'q"
        )
    
    try:
        # Legal Database servisni chaqirish
        ldb_service = LegalDatabaseService()
        
        # Qidiruvni amalga oshirish
        search_result = await ldb_service.search_documents(
            query=request.query,
            category=request.category,
            document_type=request.document_type,
            limit=request.limit,
            offset=request.offset,
            filters=request.filters or {},
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="legal_search_performed",
            resource_type="legal_document",
            details={
                "query": request.query,
                "category": request.category,
                "document_type": request.document_type,
                "results_count": len(search_result["articles"])
            }
        )
        
        return SearchResult(**search_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qidiruv xatolik: {str(e)}"
        )

@router.get("/categories")
async def get_legal_categories(
    current_user: User = Depends(get_current_user)
):
    """
    Qonun kategoriyalarini olish
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        categories = await ldb_service.get_categories()
        
        return {
            "categories": categories
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kategoriyalarni olish xatolik: {str(e)}"
        )

@router.get("/document/{document_id}")
async def get_legal_document(
    document_id: str,
    include_related: bool = False,
    include_references: bool = True,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir qonun hujjatini olish
    
    - **document_id**: Hujjat ID
    - **include_related**: Bog'liq hujjatlar
    - **include_references**: Havolalar
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        document = await ldb_service.get_document(
            document_id=document_id,
            include_related=include_related,
            include_references=include_references,
            user_id=current_user.id
        )
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hujjat topilmadi"
            )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="legal_document_viewed",
            resource_type="legal_document",
            resource_id=document_id
        )
        
        return document
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujjatni olish xatolik: {str(e)}"
        )

@router.get("/documents/{document_id}/related")
async def get_related_documents(
    document_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Bog'liq hujjatlarni olish
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        related_docs = await ldb_service.get_related_documents(
            document_id=document_id,
            limit=limit,
            user_id=current_user.id
        )
        
        return {
            "related_documents": related_docs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bog'liq hujjalarni olish xatolik: {str(e)}"
        )

@router.get("/documents/{document_id}/references")
async def get_document_references(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Hujjat havolalarini olish
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        references = await ldb_service.get_document_references(
            document_id=document_id,
            user_id=current_user.id
        )
        
        return {
            "references": references
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Havolalarni olish xatolik: {str(e)}"
        )

@router.get("/recent")
async def get_recent_documents(
    limit: int = 10,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    So'ngi ko'rilgan hujjatlar
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchining so'ngi qidiruvlari
        recent_searches = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "legal_search"
        ).order_by(LegalDocument.created_at.desc()).limit(limit).all()
        
        return {
            "recent_documents": [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.metadata.get("category") if doc.metadata else None,
                    "viewed_at": doc.created_at.isoformat()
                }
                for doc in recent_searches
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"So'ngi hujjalarni olish xatolik: {str(e)}"
        )

@router.get("/popular")
async def get_popular_documents(
    limit: int = 20,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Mashhur qonun hujjatlari
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        popular_docs = await ldb_service.get_popular_documents(
            limit=limit,
            category=category,
            user_id=current_user.id
        )
        
        return {
            "popular_documents": popular_docs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mashhur hujjalarni olish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_legal_database_stats(current_user: User = Depends(get_current_user)):
    """
    Qonunlar bazasi statistikasi
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        stats = await ldb_service.get_database_stats(user_id=current_user.id)
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistikani olish xatolik: {str(e)}"
        )

@router.post("/bookmark/{document_id}")
async def bookmark_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Hujjatni bookmark qilish
    """
    
    db = get_db_session()
    
    try:
        # Bookmark qo'shish
        bookmark = LegalDocument(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=f"Bookmark_{document_id}",
            content=document_id,
            document_type="bookmark",
            metadata={"document_id": document_id},
            created_at=datetime.utcnow()
        )
        
        db.add(bookmark)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="document_bookmarked",
            resource_type="legal_document",
            resource_id=document_id
        )
        
        return {"message": "Hujjat bookmarklandi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bookmark qilish xatolik: {str(e)}"
        )

@router.delete("/bookmark/{document_id}")
async def remove_bookmark(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Bookmarkni o'chirish
    """
    
    db = get_db_session()
    
    try:
        bookmark = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "bookmark",
            LegalDocument.content == document_id
        ).first()
        
        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookmark topilmadi"
            )
        
        db.delete(bookmark)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="bookmark_removed",
            resource_type="legal_document",
            resource_id=document_id
        )
        
        return {"message": "Bookmark o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bookmarkni o'chirish xatolik: {str(e)}"
        )

@router.get("/bookmarks")
async def get_user_bookmarks(
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    """
    Foydalanuvchi bookmarklari
    """
    
    db = get_db_session()
    
    try:
        bookmarks = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "bookmark"
        ).order_by(LegalDocument.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "bookmarks": [
                {
                    "id": bookmark.id,
                    "document_id": bookmark.content,
                    "created_at": bookmark.created_at.isoformat()
                }
                for bookmark in bookmarks
            ],
            "total": len(bookmarks)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bookmarklarni olish xatolik: {str(e)}"
        )

@router.get("/suggestions")
async def get_search_suggestions(
    query: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Qidiruv takliflari
    """
    
    try:
        ldb_service = LegalDatabaseService()
        
        suggestions = await ldb_service.get_search_suggestions(
            query=query,
            limit=limit,
            user_id=current_user.id
        )
        
        return {
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Takliflarni olish xatolik: {str(e)}"
        )
