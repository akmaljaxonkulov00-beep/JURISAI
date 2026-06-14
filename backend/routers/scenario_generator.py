"""
Scenario Generator Router
Huquqiy senariylar yaratish va generatsiyasi
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.scenario_generator_service import ScenarioGeneratorService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, CourtSession, AnalysisStatus, CaseType

router = APIRouter(prefix="/scenario-generator", tags=["Scenario Generator"])
security_scheme = HTTPBearer()

# Pydantic modellar
class ScenarioRequest(BaseModel):
    scenario_type: str
    difficulty_level: str = "medium"
    complexity: str = "standard"
    participants_count: int = 2
    focus_areas: List[str] = []
    duration_minutes: int = 30

class ScenarioResponse(BaseModel):
    id: str
    scenario_type: str
    title: str
    description: str
    difficulty_level: str
    complexity: str
    participants: List[Dict[str, Any]]
    case_data: Dict[str, Any]
    objectives: List[str]
    legal_references: List[str]
    estimated_duration: int
    ai_generated: bool
    processing_time: float
    created_at: str

class ScenarioEvaluationRequest(BaseModel):
    scenario_id: str
    user_performance: Dict[str, Any]
    completion_time: int
    decisions_made: List[str]

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

@router.post("/generate", response_model=ScenarioResponse)
async def generate_scenario(
    request: ScenarioRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Huquqiy senariyo yaratish
    
    - **scenario_type**: Senariyo turi (civil, criminal, family, labor, administrative)
    - **difficulty_level**: Qiyinlik darajasi (beginner, intermediate, advanced, expert)
    - **complexity**: Murakkablik darajasi (simple, standard, complex, expert)
    - **participants_count**: Ishtirokchilar soni
    - **focus_areas**: Diqqat markazlari
    - **duration_minutes**: Davomiyligi (daqiqa)
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "scenario_generator:use"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Senariyo generatoridan foydalanishga ruxsat yo'q"
        )
    
    try:
        # Scenario Generator servisni chaqirish
        sg_service = ScenarioGeneratorService()
        
        # Senariyoni yaratish
        scenario_result = await sg_service.generate_scenario(
            scenario_type=request.scenario_type,
            difficulty_level=request.difficulty_level,
            complexity=request.complexity,
            participants_count=request.participants_count,
            focus_areas=request.focus_areas,
            duration_minutes=request.duration_minutes,
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="scenario_generated",
            resource_type="scenario",
            resource_id=scenario_result["id"],
            details={
                "scenario_type": request.scenario_type,
                "difficulty_level": request.difficulty_level,
                "complexity": request.complexity
            }
        )
        
        return ScenarioResponse(**scenario_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariyo yaratish xatolik: {str(e)}"
        )

@router.get("/scenarios")
async def get_user_scenarios(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Foydalanuvchining senariylarini olish
    """
    
    db = get_db_session()
    
    try:
        scenarios = db.query(CourtSession).filter(
            CourtSession.user_id == current_user.id
        ).order_by(CourtSession.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "scenarios": [
                {
                    "id": scenario.id,
                    "session_name": scenario.session_name,
                    "scenario_type": scenario.scenario_type.value,
                    "user_role": scenario.user_role,
                    "status": scenario.status.value,
                    "created_at": scenario.created_at.isoformat()
                }
                for scenario in scenarios
            ],
            "total": len(scenarios)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariylarni olish xatolik: {str(e)}"
        )

@router.get("/scenario/{scenario_id}")
async def get_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir senariyoni olish
    """
    
    db = get_db_session()
    
    try:
        scenario = db.query(CourtSession).filter(
            CourtSession.id == scenario_id,
            CourtSession.user_id == current_user.id
        ).first()
        
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Senariyo topilmadi"
            )
        
        return {
            "id": scenario.id,
            "session_name": scenario.session_name,
            "scenario_type": scenario.scenario_type.value,
            "user_role": scenario.user_role,
            "participants": scenario.participants or [],
            "case_data": scenario.case_data or {},
            "transcript": scenario.transcript,
            "final_decision": scenario.final_decision,
            "ai_analysis": scenario.ai_analysis,
            "user_performance_score": scenario.user_performance_score,
            "status": scenario.status.value,
            "started_at": scenario.started_at.isoformat() if scenario.started_at else None,
            "ended_at": scenario.ended_at.isoformat() if scenario.ended_at else None,
            "created_at": scenario.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariyoni olish xatolik: {str(e)}"
        )

@router.put("/scenario/{scenario_id}")
async def update_scenario(
    scenario_id: str,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Senariyoni yangilash
    """
    
    db = get_db_session()
    
    try:
        scenario = db.query(CourtSession).filter(
            CourtSession.id == scenario_id,
            CourtSession.user_id == current_user.id
        ).first()
        
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Senariyo topilmadi"
            )
        
        # Ma'lumotlarni yangilash
        for key, value in update_data.items():
            if hasattr(scenario, key):
                setattr(scenario, key, value)
        
        scenario.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="scenario_updated",
            resource_type="scenario",
            resource_id=scenario_id,
            details={"updated_fields": list(update_data.keys())}
        )
        
        return {"message": "Senariyo muvaffaqiyatli yangilandi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariyoni yangilash xatolik: {str(e)}"
        )

@router.post("/scenario/{scenario_id}/evaluate")
async def evaluate_scenario(
    scenario_id: str,
    request: ScenarioEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Senariyoni baholash
    """
    
    # Ruxsatni tekshirish (faqat teacher, lawyer, judge)
    if not permissions.has_permission(current_user.role, "scenario_generator:evaluate"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Senariyoni baholashga ruxsat yo'q"
        )
    
    db = get_db_session()
    
    try:
        scenario = db.query(CourtSession).filter(
            CourtSession.id == scenario_id
        ).first()
        
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Senariyo topilmadi"
            )
        
        # Scenario Generator servisni chaqirish
        sg_service = ScenarioGeneratorService()
        
        evaluation_result = await sg_service.evaluate_scenario(
            scenario_id=scenario_id,
            user_performance=request.user_performance,
            completion_time=request.completion_time,
            decisions_made=request.decisions_made
        )
        
        scenario.user_performance_score = evaluation_result["performance_score"]
        scenario.status = AnalysisStatus.COMPLETED
        scenario.ended_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="scenario_evaluated",
            resource_type="scenario",
            resource_id=scenario_id,
            details={
                "evaluator_role": current_user.role,
                "performance_score": evaluation_result["performance_score"]
            }
        )
        
        return {
            "message": "Senariyo muvaffaqiyatli baholandi",
            "performance_score": evaluation_result["performance_score"],
            "feedback": evaluation_result["feedback"],
            "recommendations": evaluation_result["recommendations"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariyoni baholash xatolik: {str(e)}"
        )

@router.delete("/scenario/{scenario_id}")
async def delete_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Senariyoni o'chirish
    """
    
    db = get_db_session()
    
    try:
        scenario = db.query(CourtSession).filter(
            CourtSession.id == scenario_id,
            CourtSession.user_id == current_user.id
        ).first()
        
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Senariyo topilmadi"
            )
        
        db.delete(scenario)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="scenario_deleted",
            resource_type="scenario",
            resource_id=scenario_id
        )
        
        return {"message": "Senariyo muvaffaqiyatli o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Senariyoni o'chirish xatolik: {str(e)}"
        )

@router.get("/templates")
async def get_scenario_templates(
    current_user: User = Depends(get_current_user)
):
    """
    Senariyo shablonlarini olish
    """
    
    try:
        sg_service = ScenarioGeneratorService()
        
        templates = await sg_service.get_scenario_templates()
        
        return {
            "templates": templates
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Shablonlarni olish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_scenario_stats(current_user: User = Depends(get_current_user)):
    """
    Senariyo statistikasini olish
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchi statistikasi
        user_scenarios = db.query(CourtSession).filter(
            CourtSession.user_id == current_user.id
        ).all()
        
        total_scenarios = len(user_scenarios)
        completed_scenarios = len([s for s in user_scenarios if s.status == AnalysisStatus.COMPLETED])
        avg_performance = sum(s.user_performance_score for s in user_scenarios if s.user_performance_score > 0) / len([s for s in user_scenarios if s.user_performance_score > 0]) if user_scenarios else 0
        
        # Scenario turlari bo'yicha statistika
        scenario_type_stats = {}
        for scenario_type in CaseType:
            count = len([s for s in user_scenarios if s.scenario_type == scenario_type])
            scenario_type_stats[scenario_type.value] = count
        
        return {
            "total_scenarios": total_scenarios,
            "completed_scenarios": completed_scenarios,
            "completion_rate": (completed_scenarios / total_scenarios * 100) if total_scenarios > 0 else 0,
            "average_performance": round(avg_performance, 2),
            "scenario_type_distribution": scenario_type_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistika olish xatolik: {str(e)}"
        )
