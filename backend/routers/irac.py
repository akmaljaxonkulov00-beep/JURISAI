"""
IRAC Solver Router
IRAC metodologiyasi bo'yicha tahlil va baholash
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.irac_solver import IRACSolverService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, IRACAnalysis, AnalysisStatus, CaseType

router = APIRouter(prefix="/irac", tags=["IRAC Analysis"])
security_scheme = HTTPBearer()

# Pydantic modellar
class IRACAnalysisRequest(BaseModel):
    case_text: str
    case_type: str
    difficulty_level: str = "medium"

class IRACAnalysisResponse(BaseModel):
    id: str
    issue: str
    rule: str
    application: str
    conclusion: str
    scores: Dict[str, float]
    total_score: float
    feedback: str
    suggestions: List[str]
    processing_time: float
    status: str

class IRACUpdateRequest(BaseModel):
    component: str  # issue, rule, application, conclusion
    content: str

class IRACEvaluationRequest(BaseModel):
    analysis_id: str
    issue_score: Optional[float] = None
    rule_score: Optional[float] = None
    application_score: Optional[float] = None
    conclusion_score: Optional[float] = None

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

@router.post("/analyze", response_model=IRACAnalysisResponse)
async def analyze_case(
    request: IRACAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Case ni IRAC metodologiyasi bo'yicha tahlil qilish
    
    - **case_text**: Tahlil qilinadigan case matni
    - **case_type**: Case turi (civil, criminal, family, labor, administrative)
    - **difficulty_level**: Qiyinlik darajasi (easy, medium, hard)
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "irac:analyze"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IRAC tahliliga ruxsat yo'q"
        )
    
    try:
        # IRAC servisni chaqirish
        irac_service = IRACSolverService()
        
        # Tahlilni boshlash
        analysis_result = await irac_service.analyze_case(
            case_text=request.case_text,
            case_type=request.case_type,
            difficulty_level=request.difficulty_level,
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="irac_analysis_created",
            resource_type="irac_analysis",
            resource_id=analysis_result["id"],
            details={
                "case_type": request.case_type,
                "difficulty_level": request.difficulty_level
            }
        )
        
        return IRACAnalysisResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"IRAC tahlili xatolik: {str(e)}"
        )

@router.get("/analyses")
async def get_user_analyses(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Foydalanuvchining IRAC tahlillarini olish
    """
    
    db = get_db_session()
    
    try:
        analyses = db.query(IRACAnalysis).filter(
            IRACAnalysis.user_id == current_user.id
        ).order_by(IRACAnalysis.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "analyses": [
                {
                    "id": analysis.id,
                    "case_type": analysis.case_type.value,
                    "difficulty_level": analysis.difficulty_level,
                    "total_score": analysis.total_score,
                    "status": analysis.status.value,
                    "created_at": analysis.created_at.isoformat()
                }
                for analysis in analyses
            ],
            "total": len(analyses)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlillar olish xatolik: {str(e)}"
        )

@router.get("/analysis/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir IRAC tahlilini olish
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(IRACAnalysis).filter(
            IRACAnalysis.id == analysis_id,
            IRACAnalysis.user_id == current_user.id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        return {
            "id": analysis.id,
            "case_text": analysis.case_text,
            "case_type": analysis.case_type.value,
            "difficulty_level": analysis.difficulty_level,
            "issue": analysis.issue,
            "rule": analysis.rule,
            "application": analysis.application,
            "conclusion": analysis.conclusion,
            "scores": {
                "issue": analysis.issue_score,
                "rule": analysis.rule_score,
                "application": analysis.application_score,
                "conclusion": analysis.conclusion_score
            },
            "total_score": analysis.total_score,
            "feedback": analysis.ai_feedback,
            "suggestions": analysis.ai_suggestions or [],
            "status": analysis.status.value,
            "created_at": analysis.created_at.isoformat(),
            "updated_at": analysis.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlil olish xatolik: {str(e)}"
        )

@router.put("/analysis/{analysis_id}")
async def update_analysis(
    analysis_id: str,
    request: IRACUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    IRAC tahlil komponentini yangilash
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(IRACAnalysis).filter(
            IRACAnalysis.id == analysis_id,
            IRACAnalysis.user_id == current_user.id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        # Komponentni yangilash
        if request.component == "issue":
            analysis.issue = request.content
        elif request.component == "rule":
            analysis.rule = request.content
        elif request.component == "application":
            analysis.application = request.content
        elif request.component == "conclusion":
            analysis.conclusion = request.content
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Noto'g'ri komponent nomi"
            )
        
        analysis.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="irac_analysis_updated",
            resource_type="irac_analysis",
            resource_id=analysis_id,
            details={
                "component": request.component
            }
        )
        
        return {
            "message": "Tahlil komponenti muvaffaqiyatli yangilandi",
            "component": request.component,
            "content": request.content
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlil yangilash xatolik: {str(e)}"
        )

@router.post("/analysis/{analysis_id}/evaluate")
async def evaluate_analysis(
    analysis_id: str,
    request: IRACEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    IRAC tahlilini baholash
    """
    
    # Ruxsatni tekshirish (faqat teacher, lawyer, judge)
    if not permissions.has_permission(current_user.role, "irac:evaluate"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IRAC baholashiga ruxsat yo'q"
        )
    
    db = get_db_session()
    
    try:
        analysis = db.query(IRACAnalysis).filter(
            IRACAnalysis.id == analysis_id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tahlil topilmadi"
            )
        
        # Baholarni yangilash
        if request.issue_score is not None:
            analysis.issue_score = request.issue_score
        if request.rule_score is not None:
            analysis.rule_score = request.rule_score
        if request.application_score is not None:
            analysis.application_score = request.application_score
        if request.conclusion_score is not None:
            analysis.conclusion_score = request.conclusion_score
        
        # Umumiy ballni hisoblash
        scores = [
            analysis.issue_score,
            analysis.rule_score,
            analysis.application_score,
            analysis.conclusion_score
        ]
        analysis.total_score = sum(scores) / len(scores)
        
        analysis.status = AnalysisStatus.COMPLETED
        analysis.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="irac_analysis_evaluated",
            resource_type="irac_analysis",
            resource_id=analysis_id,
            details={
                "evaluator_role": current_user.role,
                "total_score": analysis.total_score
            }
        )
        
        return {
            "message": "Tahlil muvaffaqiyatli baholandi",
            "scores": {
                "issue": analysis.issue_score,
                "rule": analysis.rule_score,
                "application": analysis.application_score,
                "conclusion": analysis.conclusion_score
            },
            "total_score": analysis.total_score
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlil baholash xatolik: {str(e)}"
        )

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    IRAC tahlilini o'chirish
    """
    
    db = get_db_session()
    
    try:
        analysis = db.query(IRACAnalysis).filter(
            IRACAnalysis.id == analysis_id,
            IRACAnalysis.user_id == current_user.id
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
            action="irac_analysis_deleted",
            resource_type="irac_analysis",
            resource_id=analysis_id
        )
        
        return {"message": "Tahlil muvaffaqiyatli o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tahlil o'chirish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_irac_stats(current_user: User = Depends(get_current_user)):
    """
    IRAC statistikasini olish
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchi statistikasi
        user_analyses = db.query(IRACAnalysis).filter(
            IRACAnalysis.user_id == current_user.id
        ).all()
        
        total_analyses = len(user_analyses)
        completed_analyses = len([a for a in user_analyses if a.status == AnalysisStatus.COMPLETED])
        avg_score = sum(a.total_score for a in user_analyses if a.total_score > 0) / len([a for a in user_analyses if a.total_score > 0]) if user_analyses else 0
        
        # Case turlari bo'yicha statistika
        case_type_stats = {}
        for case_type in CaseType:
            count = len([a for a in user_analyses if a.case_type == case_type])
            case_type_stats[case_type.value] = count
        
        return {
            "total_analyses": total_analyses,
            "completed_analyses": completed_analyses,
            "completion_rate": (completed_analyses / total_analyses * 100) if total_analyses > 0 else 0,
            "average_score": round(avg_score, 2),
            "case_type_distribution": case_type_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistika olish xatolik: {str(e)}"
        )
