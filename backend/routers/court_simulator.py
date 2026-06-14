"""
Court Simulator Router
O'zbekiston sud simulyatsiyasi
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid
import json
import asyncio

from core.auth import get_current_user, require_permission
from core.audit import log_user_action
from services.court_simulator_service import CourtSimulatorService

router = APIRouter(prefix="/court/simulator", tags=["court-simulator"])

# Pydantic Models
class JudgeProfile(BaseModel):
    id: str
    name: str
    experience_years: int
    specialization: str
    strictness_level: float  # 0-1, qattiqlik darajasi
    bias_tendency: Optional[str] = None  # "prosecution", "defense", or None
    decision_speed: str  # "fast", "medium", "slow"
    reasoning_style: str  # "formal", "practical", "analytical"

class LawyerProfile(BaseModel):
    id: str
    name: str
    experience_years: int
    specialization: str
    success_rate: float
    argument_style: str  # "aggressive", "diplomatic", "analytical"
    preparation_level: float  # 0-1
    cross_examination_skill: float  # 0-1

class WitnessProfile(BaseModel):
    id: str
    name: str
    credibility: float  # 0-1
    nervousness_level: float  # 0-1
    memory_accuracy: float  # 0-1
    bias_tendency: Optional[str] = None
    confidence_level: float  # 0-1

class EvidenceItem(BaseModel):
    id: str
    type: str  # "document", "testimony", "physical", "digital"
    title: str
    description: str
    credibility_score: float  # 0-1
    relevance_score: float  # 0-1
    authenticity_score: float  # 0-1
    presented_by: str  # "prosecution" or "defense"

class CaseScenario(BaseModel):
    id: str
    title: str
    case_type: str  # "criminal", "civil", "administrative"
    description: str
    legal_basis: List[str]
    difficulty_level: str  # "beginner", "intermediate", "advanced"
    estimated_duration: int  # minutes
    key_issues: List[str]
    required_evidence: List[str]

class SimulationRequest(BaseModel):
    case_id: str
    user_role: str  # "prosecution", "defense", "judge"
    difficulty_level: str
    simulation_type: str  # "full_trial", "hearing", "argument_practice"
    custom_parameters: Optional[Dict[str, Any]] = None

class ArgumentSubmission(BaseModel):
    simulation_id: str
    argument_type: str  # "opening", "closing", "objection", "question"
    content: str
    target_id: Optional[str] = None  # For objections or questions
    evidence_references: List[str] = []

class SimulationResponse(BaseModel):
    success: bool
    simulation_id: str
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None

class SimulationStatus(BaseModel):
    simulation_id: str
    status: str  # "preparing", "active", "paused", "completed"
    current_phase: str
    elapsed_time: int
    remaining_time: Optional[int] = None
    participants: Dict[str, Any]
    current_speaker: Optional[str] = None
    last_action: Optional[str] = None

class SimulationResult(BaseModel):
    simulation_id: str
    outcome: str
    verdict: Optional[str] = None
    score: int
    feedback: Dict[str, Any]
    performance_metrics: Dict[str, float]
    recommendations: List[str]
    learning_points: List[str]

@router.post("/start", response_model=SimulationResponse)
async def start_simulation(
    request: SimulationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Sud simulyatsiyasini boshlash
    """
    try:
        user_id = current_user["sub"]
        
        # Permission check
        require_permission(current_user, "court_simulator:access")
        
        # Create simulation
        service = CourtSimulatorService()
        simulation = await service.create_simulation(
            user_id=user_id,
            case_id=request.case_id,
            user_role=request.user_role,
            difficulty_level=request.difficulty_level,
            simulation_type=request.simulation_type,
            custom_parameters=request.custom_parameters or {}
        )
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_simulation_started",
            {"simulation_id": simulation["id"], "case_id": request.case_id}
        )
        
        return SimulationResponse(
            success=True,
            simulation_id=simulation["id"],
            status="preparing",
            message="Simulyatsiya tayyorlanmoqda",
            data={"estimated_start": simulation["estimated_start"]}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulyatsiyani boshlash xatolik: {str(e)}")

@router.get("/status/{simulation_id}", response_model=SimulationStatus)
async def get_simulation_status(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiya holatini olish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        status = await service.get_simulation_status(simulation_id, user_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Simulyatsiya topilmadi")
        
        return SimulationStatus(**status)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Holatni olish xatolik: {str(e)}")

@router.post("/argument", response_model=Dict[str, Any])
async def submit_argument(
    submission: ArgumentSubmission,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Argument yuborish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        result = await service.process_argument(
            simulation_id=submission.simulation_id,
            user_id=user_id,
            argument_type=submission.argument_type,
            content=submission.content,
            target_id=submission.target_id,
            evidence_references=submission.evidence_references
        )
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_argument_submitted",
            {
                "simulation_id": submission.simulation_id,
                "argument_type": submission.argument_type,
                "evidence_count": len(submission.evidence_references)
            }
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Argumentni yuborish xatolik: {str(e)}")

@router.get("/cases", response_model=List[CaseScenario])
async def get_available_cases(
    case_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Mavjud holatlar ro'yxati
    """
    try:
        require_permission(current_user, "court_simulator:access")
        
        service = CourtSimulatorService()
        cases = await service.get_available_cases(case_type, difficulty)
        
        return [CaseScenario(**case) for case in cases]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Holatlarni olish xatolik: {str(e)}")

@router.get("/case/{case_id}", response_model=Dict[str, Any])
async def get_case_details(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Holat tafsilotlari
    """
    try:
        require_permission(current_user, "court_simulator:access")
        
        service = CourtSimulatorService()
        case = await service.get_case_details(case_id)
        
        if not case:
            raise HTTPException(status_code=404, detail="Holat topilmadi")
        
        return case
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Holat tafsilotlarini olish xatolik: {str(e)}")

@router.get("/participants/{simulation_id}", response_model=Dict[str, Any])
async def get_simulation_participants(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiya ishtirokchilari
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        participants = await service.get_simulation_participants(simulation_id, user_id)
        
        return participants
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ishtirokchilarni olish xatolik: {str(e)}")

@router.get("/evidence/{simulation_id}", response_model=List[EvidenceItem])
async def get_simulation_evidence(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiya dalillari
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        evidence = await service.get_simulation_evidence(simulation_id, user_id)
        
        return [EvidenceItem(**item) for item in evidence]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dalillarni olish xatolik: {str(e)}")

@router.post("/pause/{simulation_id}", response_model=Dict[str, str])
async def pause_simulation(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiyani to'xtatish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        result = await service.pause_simulation(simulation_id, user_id)
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_simulation_paused",
            {"simulation_id": simulation_id}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulyatsiyani to'xtatish xatolik: {str(e)}")

@router.post("/resume/{simulation_id}", response_model=Dict[str, str])
async def resume_simulation(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiyani davom ettirish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        result = await service.resume_simulation(simulation_id, user_id)
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_simulation_resumed",
            {"simulation_id": simulation_id}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulyatsiyani davom ettirish xatolik: {str(e)}")

@router.post("/end/{simulation_id}", response_model=SimulationResult)
async def end_simulation(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiyani tugatish va natijalarni olish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        result = await service.end_simulation(simulation_id, user_id)
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_simulation_completed",
            {
                "simulation_id": simulation_id,
                "outcome": result.get("outcome"),
                "score": result.get("score", 0)
            }
        )
        
        return SimulationResult(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulyatsiyani tugatish xatolik: {str(e)}")

@router.get("/history", response_model=List[Dict[str, Any]])
async def get_simulation_history(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulyatsiya tarixi
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        history = await service.get_user_simulation_history(user_id, limit, offset)
        
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tarixni olish xatolik: {str(e)}")

@router.get("/statistics", response_model=Dict[str, Any])
async def get_user_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Foydalanuvchi statistikasi
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        stats = await service.get_user_statistics(user_id)
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statistikani olish xatolik: {str(e)}")

@router.post("/feedback/{simulation_id}", response_model=Dict[str, str])
async def submit_feedback(
    simulation_id: str,
    feedback_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Fikr-mulohaza yuborish
    """
    try:
        user_id = current_user["sub"]
        
        service = CourtSimulatorService()
        result = await service.submit_feedback(simulation_id, user_id, feedback_data)
        
        # Log action
        background_tasks.add_task(
            log_user_action,
            user_id,
            "court_simulation_feedback",
            {"simulation_id": simulation_id}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fikr-mulohazani yuborish xatolik: {str(e)}")

@router.get("/leaderboard", response_model=List[Dict[str, Any]])
async def get_leaderboard(
    period: str = "weekly",  # "daily", "weekly", "monthly", "all_time"
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Eng yaxshi natijalar
    """
    try:
        require_permission(current_user, "court_simulator:view_leaderboard")
        
        service = CourtSimulatorService()
        leaderboard = await service.get_leaderboard(period, limit)
        
        return leaderboard
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eng yaxshi natijalarni olish xatolik: {str(e)}")
