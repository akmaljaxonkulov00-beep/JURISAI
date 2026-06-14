"""
Document Generator Router
Huquqiy hujjatlar yaratish va generatsiyasi
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.document_generator_service import DocumentGeneratorService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, LegalDocument, AnalysisStatus

router = APIRouter(prefix="/document-generator", tags=["Document Generator"])
security_scheme = HTTPBearer()

# Pydantic modellar
class DocumentGenerationRequest(BaseModel):
    template_id: str
    document_data: Dict[str, Any]
    output_format: str = "pdf"  # pdf, docx, html
    language: str = "uz"  # uz, ru, en
    custom_fields: Optional[Dict[str, Any]] = {}

class DocumentGenerationResponse(BaseModel):
    id: str
    template_name: str
    document_type: str
    content: str
    file_url: Optional[str]
    metadata: Dict[str, Any]
    status: str
    created_at: str

class DocumentTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    fields: List[Dict[str, Any]]
    legal_references: List[str]
    preview_text: str

class DocumentUpdateRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = {}

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

@router.post("/generate", response_model=DocumentGenerationResponse)
async def generate_document(
    request: DocumentGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Huquqiy hujjat yaratish
    
    - **template_id**: Shablon ID
    - **document_data**: Hujjat ma'lumotlari
    - **output_format**: Chiqarish formati
    - **language**: Til
    - **custom_fields**: Qo'shimcha maydonlar
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "document_generator:use"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hujjat generatoridan foydalanishga ruxsat yo'q"
        )
    
    try:
        # Document Generator servisni chaqirish
        dg_service = DocumentGeneratorService()
        
        # Hujjatni yaratish
        document_result = await dg_service.generate_document(
            template_id=request.template_id,
            document_data=request.document_data,
            output_format=request.output_format,
            language=request.language,
            custom_fields=request.custom_fields or {},
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="document_generated",
            resource_type="document",
            resource_id=document_result["id"],
            details={
                "template_id": request.template_id,
                "output_format": request.output_format,
                "language": request.language
            }
        )
        
        return DocumentGenerationResponse(**document_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujjat yaratish xatolik: {str(e)}"
        )

@router.get("/templates")
async def get_document_templates(
    current_user: User = Depends(get_current_user),
    category: Optional[str] = None
):
    """
    Hujjat shablonlarini olish
    
    - **category**: Kategoriya (ixtiyoriy)
    """
    
    try:
        dg_service = DocumentGeneratorService()
        
        templates = await dg_service.get_document_templates(category)
        
        return {
            "templates": templates
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Shablonlarni olish xatolik: {str(e)}"
        )

@router.get("/template/{template_id}")
async def get_document_template(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir shablonni olish
    """
    
    try:
        dg_service = DocumentGeneratorService()
        
        template = await dg_service.get_document_template(template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shablon topilmadi"
            )
        
        return template
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Shablonni olish xatolik: {str(e)}"
        )

@router.get("/documents")
async def get_user_documents(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Foydalanuvchining hujjatlarini olish
    """
    
    db = get_db_session()
    
    try:
        documents = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "generated_document"
        ).order_by(LegalDocument.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "documents": [
                {
                    "id": document.id,
                    "title": document.title,
                    "content": document.content,
                    "metadata": document.metadata or {},
                    "created_at": document.created_at.isoformat()
                }
                for document in documents
            ],
            "total": len(documents)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujatlarni olish xatolik: {str(e)}"
        )

@router.get("/document/{document_id}")
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir hujjatni olish
    """
    
    db = get_db_session()
    
    try:
        document = db.query(LegalDocument).filter(
            LegalDocument.id == document_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "generated_document"
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hujjat topilmadi"
            )
        
        return {
            "id": document.id,
            "title": document.title,
            "content": document.content,
            "metadata": document.metadata or {},
            "created_at": document.created_at.isoformat(),
            "updated_at": document.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujjatni olish xatolik: {str(e)}"
        )

@router.put("/document/{document_id}")
async def update_document(
    document_id: str,
    request: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Hujjatni yangilash
    """
    
    db = get_db_session()
    
    try:
        document = db.query(LegalDocument).filter(
            LegalDocument.id == document_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "generated_document"
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hujjat topilmadi"
            )
        
        # Ma'lumotlarni yangilash
        document.content = request.content
        if request.metadata:
            document.metadata = request.metadata
        
        document.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="document_updated",
            resource_type="document",
            resource_id=document_id,
            details={"updated_fields": ["content", "metadata"]}
        )
        
        return {"message": "Hujjat muvaffaqiyatli yangilandi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujjatni yangilash xatolik: {str(e)}"
        )

@router.delete("/document/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Hujjatni o'chirish
    """
    
    db = get_db_session()
    
    try:
        document = db.query(LegalDocument).filter(
            LegalDocument.id == document_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "generated_document"
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hujjat topilmadi"
            )
        
        db.delete(document)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="document_deleted",
            resource_type="document",
            resource_id=document_id
        )
        
        return {"message": "Hujjat muvaffaqiyatli o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hujjatni o'chirish xatolik: {str(e)}"
        )

@router.post("/template/preview")
async def preview_template(
    template_id: str,
    document_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Shablonni oldindan ko'rish
    """
    
    try:
        dg_service = DocumentGeneratorService()
        
        preview = await dg_service.preview_template(
            template_id=template_id,
            document_data=document_data,
            user_id=current_user.id
        )
        
        return preview
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Oldindan ko'rish xatolik: {str(e)}"
        )

@router.get("/categories")
async def get_document_categories(
    current_user: User = Depends(get_current_user)
):
    """
    Hujjat kategoriyalarini olish
    """
    
    try:
        dg_service = DocumentGeneratorService()
        
        categories = await dg_service.get_document_categories()
        
        return {
            "categories": categories
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kategoriyalarni olish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_document_generator_stats(current_user: User = Depends(get_current_user)):
    """
    Hujjat generator statistikasini olish
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchi statistikasi
        user_documents = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "generated_document"
        ).all()
        
        total_documents = len(user_documents)
        
        # Kategoriyalar bo'yicha statistika
        category_stats = {}
        for document in user_documents:
            metadata = document.metadata or {}
            category = metadata.get("category", "unknown")
            category_stats[category] = category_stats.get(category, 0) + 1
        
        # Tillar bo'yicha statistika
        language_stats = {}
        for document in user_documents:
            metadata = document.metadata or {}
            language = metadata.get("language", "unknown")
            language_stats[language] = language_stats.get(language, 0) + 1
        
        return {
            "total_documents": total_documents,
            "category_distribution": category_stats,
            "language_distribution": language_stats,
            "most_used_category": max(category_stats.items(), key=lambda x: x[1])[0] if category_stats else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistika olish xatolik: {str(e)}"
        )
