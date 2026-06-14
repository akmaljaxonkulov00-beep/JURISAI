"""
Decision Tree Router
Qaror daraxti analizi va tavsiyalar
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import asyncio

from ..services.decision_tree_service import DecisionTreeService
from ..core.security import security, permissions, audit
from ..core.database import get_db_session
from ..core.models import User, DecisionTree, AnalysisStatus, CaseType

router = APIRouter(prefix="/decision-tree", tags=["Decision Tree"])
security_scheme = HTTPBearer()

# Pydantic modellar
class DecisionTreeRequest(BaseModel):
    scenario_title: str
    scenario_description: str
    case_type: str
    initial_decisions: Dict[str, Any] = {}

class DecisionTreeResponse(BaseModel):
    id: str
    scenario_title: str
    scenario_description: str
    tree_data: Dict[str, Any]
    current_node: str
    path_taken: List[str]
    final_decision: Optional[str]
    confidence_score: float
    risk_assessment: Dict[str, Any]
    ai_recommendations: List[str]
    processing_time: float
    status: str

class DecisionUpdateRequest(BaseModel):
    node_id: str
    decision: str
    confidence: float = 0.5

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

@router.post("/analyze", response_model=DecisionTreeResponse)
async def analyze_decision_path(
    request: DecisionTreeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Qaror daraxti analizini boshlash
    
    - **scenario_title**: Senariyo nomi
    - **scenario_description**: Senariyo tavsifi
    - **case_type**: Case turi
    - **initial_decisions**: Dastlabki qarorlar
    """
    
    # Ruxsatni tekshirish
    if not permissions.has_permission(current_user.role, "decision_tree:use"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Qaror daraxti ishlatishga ruxsat yo'q"
        )
    
    try:
        # Decision Tree servisni chaqirish
        dt_service = DecisionTreeService()
        
        # Analizni boshlash
        analysis_result = await dt_service.analyze_decision_path(
            scenario_title=request.scenario_title,
            scenario_description=request.scenario_description,
            case_type=request.case_type,
            initial_decisions=request.initial_decisions,
            user_id=current_user.id
        )
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="decision_tree_analysis_created",
            resource_type="decision_tree",
            resource_id=analysis_result["id"],
            details={
                "scenario_title": request.scenario_title,
                "case_type": request.case_type
            }
        )
        
        return DecisionTreeResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxti tahlili xatolik: {str(e)}"
        )

@router.get("/trees")
async def get_user_decision_trees(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """
    Foydalanuvchining qaror daraxtlarini olish
    """
    
    db = get_db_session()
    
    try:
        trees = db.query(DecisionTree).filter(
            DecisionTree.user_id == current_user.id
        ).order_by(DecisionTree.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "trees": [
                {
                    "id": tree.id,
                    "scenario_title": tree.scenario_title,
                    "scenario_description": tree.scenario_description,
                    "confidence_score": tree.confidence_score,
                    "final_decision": tree.final_decision,
                    "status": tree.status.value,
                    "created_at": tree.created_at.isoformat()
                }
                for tree in trees
            ],
            "total": len(trees)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxtlarini olish xatolik: {str(e)}"
        )

@router.get("/tree/{tree_id}")
async def get_decision_tree(
    tree_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Ma'lum bir qaror daraxtini olish
    """
    
    db = get_db_session()
    
    try:
        tree = db.query(DecisionTree).filter(
            DecisionTree.id == tree_id,
            DecisionTree.user_id == current_user.id
        ).first()
        
        if not tree:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Qaror daraxti topilmadi"
            )
        
        return {
            "id": tree.id,
            "scenario_title": tree.scenario_title,
            "scenario_description": tree.scenario_description,
            "tree_data": tree.tree_data,
            "current_node": tree.current_node,
            "path_taken": tree.path_taken or [],
            "final_decision": tree.final_decision,
            "confidence_score": tree.confidence_score,
            "risk_assessment": tree.risk_assessment or {},
            "ai_recommendations": tree.ai_recommendations or [],
            "status": tree.status.value,
            "created_at": tree.created_at.isoformat(),
            "updated_at": tree.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxtini olish xatolik: {str(e)}"
        )

@router.put("/tree/{tree_id}/update")
async def update_decision_tree(
    tree_id: str,
    request: DecisionUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Qaror daraxtini yangilash
    """
    
    db = get_db_session()
    
    try:
        tree = db.query(DecisionTree).filter(
            DecisionTree.id == tree_id,
            DecisionTree.user_id == current_user.id
        ).first()
        
        if not tree:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Qaror daraxti topilmadi"
            )
        
        # Decision Tree servisni chaqirish
        dt_service = DecisionTreeService()
        
        # Yangilash
        update_result = await dt_service.update_decision_path(
            tree_id=tree_id,
            node_id=request.node_id,
            decision=request.decision,
            confidence=request.confidence
        )
        
        tree.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="decision_tree_updated",
            resource_type="decision_tree",
            resource_id=tree_id,
            details={
                "node_id": request.node_id,
                "decision": request.decision
            }
        )
        
        return {
            "message": "Qaror daraxti muvaffaqiyatli yangilandi",
            "current_node": update_result["current_node"],
            "path_taken": update_result["path_taken"],
            "confidence_score": update_result["confidence_score"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxtini yangilash xatolik: {str(e)}"
        )

@router.get("/nodes")
async def get_decision_tree_nodes(
    scenario: str,
    current_user: User = Depends(get_current_user)
):
    """
    Qaror daraxti tugunlarini olish
    """
    
    try:
        dt_service = DecisionTreeService()
        
        nodes = await dt_service.get_tree_nodes(scenario)
        
        return {
            "nodes": nodes,
            "scenario": scenario
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tugunlarni olish xatolik: {str(e)}"
        )

@router.post("/tree/{tree_id}/evaluate")
async def evaluate_decision_tree(
    tree_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Qaror daraxtini baholash
    """
    
    # Ruxsatni tekshirish (faqat teacher, lawyer, judge)
    if not permissions.has_permission(current_user.role, "decision_tree:evaluate"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Qaror daraxtini baholashga ruxsat yo'q"
        )
    
    db = get_db_session()
    
    try:
        tree = db.query(DecisionTree).filter(
            DecisionTree.id == tree_id
        ).first()
        
        if not tree:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Qaror daraxti topilmadi"
            )
        
        # Decision Tree servisni chaqirish
        dt_service = DecisionTreeService()
        
        evaluation_result = await dt_service.evaluate_decision_tree(tree_id)
        
        tree.status = AnalysisStatus.COMPLETED
        tree.updated_at = datetime.utcnow()
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="decision_tree_evaluated",
            resource_type="decision_tree",
            resource_id=tree_id,
            details={
                "evaluator_role": current_user.role,
                "confidence_score": evaluation_result["confidence_score"]
            }
        )
        
        return {
            "message": "Qaror daraxti muvaffaqiyatli baholandi",
            "confidence_score": evaluation_result["confidence_score"],
            "risk_assessment": evaluation_result["risk_assessment"],
            "recommendations": evaluation_result["recommendations"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxtini baholash xatolik: {str(e)}"
        )

@router.delete("/tree/{tree_id}")
async def delete_decision_tree(
    tree_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Qaror daraxtini o'chirish
    """
    
    db = get_db_session()
    
    try:
        tree = db.query(DecisionTree).filter(
            DecisionTree.id == tree_id,
            DecisionTree.user_id == current_user.id
        ).first()
        
        if not tree:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Qaror daraxti topilmadi"
            )
        
        db.delete(tree)
        db.commit()
        
        # Audit log
        audit.log_action(
            user_id=current_user.id,
            action="decision_tree_deleted",
            resource_type="decision_tree",
            resource_id=tree_id
        )
        
        return {"message": "Qaror daraxti muvaffaqiyatli o'chirildi"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Qaror daraxtini o'chirish xatolik: {str(e)}"
        )

@router.get("/stats")
async def get_decision_tree_stats(current_user: User = Depends(get_current_user)):
    """
    Qaror daraxti statistikasini olish
    """
    
    db = get_db_session()
    
    try:
        # Foydalanuvchi statistikasi
        user_trees = db.query(DecisionTree).filter(
            DecisionTree.user_id == current_user.id
        ).all()
        
        total_trees = len(user_trees)
        completed_trees = len([t for t in user_trees if t.status == AnalysisStatus.COMPLETED])
        avg_confidence = sum(t.confidence_score for t in user_trees if t.confidence_score > 0) / len([t for t in user_trees if t.confidence_score > 0]) if user_trees else 0
        
        return {
            "total_trees": total_trees,
            "completed_trees": completed_trees,
            "completion_rate": (completed_trees / total_trees * 100) if total_trees > 0 else 0,
            "average_confidence": round(avg_confidence, 2)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistika olish xatolik: {str(e)}"
        )
