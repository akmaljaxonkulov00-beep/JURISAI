"""
Weakness Detector Router
Argumentlardagi zaifliklarni aniqlash va tahlil qilish
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.weakness_detector_service import WeaknessDetectorService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, LegalDocument, AnalysisStatus

router = APIRouter(prefix="/weakness-detector", tags=["Weakness Detector"])
security_scheme = HTTPBearer()

# Pydantic modellar
class WeaknessDetectionRequest(BaseModel):
    argument_text: str
    argument_type: str  # legal, factual, logical, emotional
    context: Optional[str] = None
    target_audience: Optional[str] = None
    analysis_depth: str = "standard"  # basic, standard, comprehensive

class WeaknessPoint(BaseModel):
    id: str
    weakness_type: str
    description: str
    severity: str  # low, medium, high, critical
    location: str  # text location
    suggestion: str
    legal_references: List[str]

class WeaknessDetectionResponse(BaseModel):
    id: str
    argument_text: str
    argument_type: str
    overall_score: float
    weakness_points: List[WeaknessPoint]
    strengths: List[str]
    improvement_suggestions: List[str]
    legal_compliance_score: float
    logical_coherence_score: float
    factual_accuracy_score: float
    persuasive_power_score: float
    processing_time: float
    created_at: str

class ArgumentImprovementRequest(BaseModel):
    original_argument: str
    weakness_points: List[str]
    improvement_style: str = "formal"  # formal, conversational, persuasive
    target_length: Optional[str] = None

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

@router.post("/detect", response_model=WeaknessDetectionResponse)
async def detect_weaknesses(
    request: WeaknessDetectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Argumentdagi zaifliklarni aniqlash
    
    - **argument_text**: Argument matni
    - **argument_type**: Argument turi (legal, factual, logical, emotional)
    - **context**: Kontekst (ixtiyoriy)
    - **target_audience**: Maqsad auditoriya (ixtiyoriy)
    - **analysis_depth**: Tahlil chuqurligi
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "weakness_detector:use"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zaiflik detektoridan foydalanishga ruxsat yo'q"
        )
    
    try:
        # Weakness Detector servisni chaqirish
        wd_service = WeaknessDetectorService()
        
        # Zaifliklarni aniqlash
        detection_result = await wd_service.detect_weaknesses(
            argument_text=request.argument_text,
            argument_type=request.argument_type,
            context=request.context,
            target_audience=request.target_audience,
            analysis_depth=request.analysis_depth,
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="weakness_detection_performed",
            resource_type="argument",
            resource_id=detection_result["id"],
            details={
                "argument_type": request.argument_type,
                "analysis_depth": request.analysis_depth,
                "weakness_count": len(detection_result["weakness_points"])
            }
        )
        
        return WeaknessDetectionResponse(**detection_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Zaifliklarni aniqlash xatolik: {str(e)}"
        )

@router.post("/improve")
async def improve_argument(
    request: ArgumentImprovementRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Argumentni yaxshilash takliflari
    
    - **original_argument**: Asl argument
    - **weakness_points**: Zaiflik nuqtalari
    - **improvement_style**: Yaxshilash uslubi
    - **target_length**: Maqsad uzunligi
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "weakness_detector:use"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Argument yaxshilashga ruxsat yo'q"
        )
    
    try:
        # Weakness Detector servisni chaqirish
        wd_service = WeaknessDetectorService()
        
        # Argumentni yaxshilash
        improvement_result = await wd_service.improve_argument(
            original_argument=request.original_argument,
            weakness_points=request.weakness_points,
            improvement_style=request.improvement_style,
            target_length=request.target_length,
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="argument_improved",
            resource_type="argument",
            details={
                "improvement_style": request.improvement_style,
                "weakness_count": len(request.weakness_points)
            }
        )
        
        return improvement_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Argument yaxshilash xatolik: {str(e)}"
        )

@router.get("/analyses")
async def get_user_analyses(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Foydalanuvchining zaiflik tahlillarini olish
    """
    
    db = get_db_session()
    
    try:
        analyses = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "weakness_analysis"
        ).order_by(LegalDocument.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "analyses": [
                {
                    "id": analysis.id,
                    "title": analysis.title,
                    "content": analysis.content,
                    "metadata": analysis.metadata or {},
                    "created_at": analysis.created_at.isoformat()
                }
                for analysis in analyses
            ],
            "total": len(analyses)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlillarni olish xatolik: {str(e)}"
        )

@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir tahlilni olish
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(LegalDocument).filter(
            LegalDocument.id == analysis_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "weakness_analysis"
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        return {
            "id": analysis.id,
            "title": analysis.title,
            "content": analysis.content,
            "metadata": analysis.metadata or {},
            "created_at": analysis.created_at.isoformat(),
            "updated_at": analysis.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlilni olish xatolik: {str(e)}"
        )

@router.put("/analysis/{analysis_id}")
async def update_analysis(
    analysis_id: str,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Tahlilni yangilash
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(LegalDocument).filter(
            LegalDocument.id == analysis_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "weakness_analysis"
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        # Ma'lumotlarni yangilash
        for key, value in update_data.items():
            if key == "content":
                analysis.content = value
            elif key == "title":
                analysis.title = value
            elif key == "metadata":
                analysis.metadata = value
        
        analysis.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="weakness_analysis_updated",
            resource_type="analysis",
            resource_id=analysis_id,
            details={"updated_fields": list(update_data.keys())}
        )
        
        return {"message": "Tahlil muvaffaqiyatli yangilandi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlilni yangilash xatolik: {str(e)}"
        )

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Tahlilni o'chirish
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(LegalDocument).filter(
            LegalDocument.id == analysis_id,
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "weakness_analysis"
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        db.delete(analysis)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="weakness_analysis_deleted",
            resource_type="analysis",
            resource_id=analysis_id
        )
        
        return {"message": "Tahlil muvaffaqiyatli o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlilni o'chirish xatolik: {str(e)}"
        )

@router.get("/weakness-types")
async def get_weakness_types(
    current_user: User = Depends(get_current_user)
):
    """
    Zaiflik turlarini olish
    """
    
    try:
        wd_service = WeaknessDetectorService()
        
        weakness_types = wd_service.get_weakness_types()
        
        return {
            "weakness_types": weakness_types
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Zaiflik turlarini olish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_weakness_detector_stats(current_user: User = Depends(get_current_user)):
    """
    Zaiflik detektori statistikasini olish
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchi statistikasi
        user_analyses = db.query(LegalDocument).filter(
            LegalDocument.user_id == current_user.id,
            LegalDocument.document_type == "weakness_analysis"
        ).all()
        
        total_analyses = len(user_analyses)
        
        # Zaiflik turlari bo'yicha statistika
        weakness_type_stats = {}
        overall_scores = []
        
        for analysis in user_analyses:
            metadata = analysis.metadata or {}
            if "overall_score" in metadata:
                overall_scores.append(metadata["overall_score"])
            
            if "weakness_points" in metadata:
                for point in metadata["weakness_points"]:
                    weakness_type = point.get("weakness_type", "unknown")
                    weakness_type_stats[weakness_type] = weakness_type_stats.get(weakness_type, 0) + 1
        
        avg_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0
        
        return {
            "total_analyses": total_analyses,
            "average_score": round(avg_score, 2),
            "weakness_type_distribution": weakness_type_stats,
            "most_common_weakness": max(weakness_type_stats.items(), key=lambda x: x[1])[0] if weakness_type_stats else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistika olish xatolik: {str(e)}"
        )
