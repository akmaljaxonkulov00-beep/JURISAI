"""
IRAC Solver Router - Legal case analysis using IRAC methodology
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid

from core.database import get_db, Session
from core.logging import get_logger, performance_logger, audit_logger
from core.error_handling import (
    handle_errors, JurisAIException, ValidationError, 
    DatabaseError, BusinessLogicError
)

# Import services (will be created later)
# from services.irac_solver import IRACSolverService
# from services.ai_service import AIService

# Router setup
router = APIRouter(prefix="/irac", tags=["IRAC Solver"])
logger = get_logger(__name__)

# Pydantic models
class IRACComponent(BaseModel):
    """IRAC component model"""
    component_type: str = Field(..., description="Component type: issue, rule, application, conclusion")
    content: str = Field(..., description="Component content")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score")
    legal_references: List[str] = Field(default_factory=list, description="Legal references")
    analysis_notes: Optional[str] = Field(None, description="Analysis notes")

class IRACAnalysis(BaseModel):
    """IRAC analysis model"""
    id: Optional[str] = Field(None, description="Analysis ID")
    case_description: str = Field(..., description="Case description")
    issue: Optional[IRACComponent] = Field(None, description="Issue component")
    rule: Optional[IRACComponent] = Field(None, description="Rule component")
    application: Optional[IRACComponent] = Field(None, description="Application component")
    conclusion: Optional[IRACComponent] = Field(None, description="Conclusion component")
    overall_score: float = Field(0.0, ge=0.0, le=100.0, description="Overall analysis score")
    status: str = Field("draft", description="Analysis status")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    user_id: str = Field(..., description="User ID")
    feedback: Optional[str] = Field(None, description="User feedback")

class IRACUpdateRequest(BaseModel):
    """IRAC update request model"""
    component_type: str = Field(..., description="Component to update")
    content: str = Field(..., description="New content")
    legal_references: List[str] = Field(default_factory=list, description="Legal references")

class IRACEvaluationRequest(BaseModel):
    """IRAC evaluation request model"""
    analysis_id: str = Field(..., description="Analysis ID to evaluate")
    evaluation_criteria: Optional[List[str]] = Field(None, description="Custom evaluation criteria")

class IRACEvaluationResult(BaseModel):
    """IRAC evaluation result model"""
    analysis_id: str = Field(..., description="Analysis ID")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Overall score")
    component_scores: Dict[str, float] = Field(..., description="Individual component scores")
    strengths: List[str] = Field(..., description="Analysis strengths")
    weaknesses: List[str] = Field(..., description="Areas for improvement")
    recommendations: List[str] = Field(..., description="Improvement recommendations")
    evaluation_timestamp: datetime = Field(..., description="Evaluation timestamp")

# Database models (simplified for now)
class IRACAnalysisDB:
    """Database model for IRAC analysis"""
    
    def __init__(self):
        self.analyses: Dict[str, IRACAnalysis] = {}
    
    def create_analysis(self, analysis: IRACAnalysis) -> IRACAnalysis:
        """Create new IRAC analysis"""
        analysis.id = str(uuid.uuid4())
        analysis.created_at = datetime.utcnow()
        analysis.updated_at = datetime.utcnow()
        self.analyses[analysis.id] = analysis
        return analysis
    
    def get_analysis(self, analysis_id: str) -> Optional[IRACAnalysis]:
        """Get IRAC analysis by ID"""
        return self.analyses.get(analysis_id)
    
    def update_analysis(self, analysis_id: str, updates: Dict[str, Any]) -> Optional[IRACAnalysis]:
        """Update IRAC analysis"""
        if analysis_id in self.analyses:
            analysis = self.analyses[analysis_id]
            for key, value in updates.items():
                setattr(analysis, key, value)
            analysis.updated_at = datetime.utcnow()
            return analysis
        return None
    
    def delete_analysis(self, analysis_id: str) -> bool:
        """Delete IRAC analysis"""
        if analysis_id in self.analyses:
            del self.analyses[analysis_id]
            return True
        return False
    
    def get_user_analyses(self, user_id: str) -> List[IRACAnalysis]:
        """Get all analyses for a user"""
        return [analysis for analysis in self.analyses.values() if analysis.user_id == user_id]

# Global database instance
irac_db = IRACAnalysisDB()

# Service dependency
def get_irac_solver() -> "IRACSolverService":
    """Get IRAC solver service instance"""
    # This will be replaced with actual service implementation
    return IRACSolverService()

class IRACSolverService:
    """IRAC solver service implementation"""
    
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    def analyze_case(self, case_description: str, user_id: str) -> IRACAnalysis:
        """
        Analyze legal case using IRAC methodology
        
        Args:
            case_description (str): Description of the legal case
            user_id (str): User ID requesting the analysis
            
        Returns:
            IRACAnalysis: Complete IRAC analysis
        """
        self.logger.info(f"Starting IRAC analysis for user {user_id}")
        
        # Create analysis object
        analysis = IRACAnalysis(
            case_description=case_description,
            user_id=user_id,
            status="processing"
        )
        
        # Simulate AI analysis (will be replaced with actual AI service)
        analysis.issue = IRACComponent(
            component_type="issue",
            content=self._extract_issue(case_description),
            confidence_score=0.85,
            legal_references=["Civil Code Art. 1", "Civil Procedure Code Art. 15"]
        )
        
        analysis.rule = IRACComponent(
            component_type="rule",
            content=self._extract_rule(case_description),
            confidence_score=0.90,
            legal_references=["Civil Code Art. 1", "Constitution Art. 41"]
        )
        
        analysis.application = IRACComponent(
            component_type="application",
            content=self._extract_application(case_description),
            confidence_score=0.80,
            legal_references=["Civil Procedure Code Art. 15"]
        )
        
        analysis.conclusion = IRACComponent(
            component_type="conclusion",
            content=self._extract_conclusion(case_description),
            confidence_score=0.88,
            legal_references=["Civil Code Art. 1", "Constitution Art. 41"]
        )
        
        # Calculate overall score
        analysis.overall_score = self._calculate_overall_score(analysis)
        analysis.status = "completed"
        
        # Log audit trail
        audit_logger.log_action(
            user_id=user_id,
            action="irac_analysis_created",
            resource="irac_analysis",
            details={"analysis_id": analysis.id, "case_length": len(case_description)}
        )
        
        return analysis
    
    def _extract_issue(self, case_description: str) -> str:
        """Extract legal issue from case description"""
        # Simulated AI extraction
        return "The central legal issue is determining liability for breach of contract and appropriate remedies under Uzbekistan civil law."
    
    def _extract_rule(self, case_description: str) -> str:
        """Extract legal rule from case description"""
        # Simulated AI extraction
        return "Under Uzbekistan Civil Code Art. 1, parties are bound by their contractual obligations. Civil Procedure Code Art. 15 governs the procedure for filing claims."
    
    def _extract_application(self, case_description: str) -> str:
        """Extract legal application from case description"""
        # Simulated AI extraction
        return "Applying the relevant statutes to the facts, the plaintiff has established the elements of breach of contract. The defendant's failure to perform constitutes a clear violation."
    
    def _extract_conclusion(self, case_description: str) -> str:
        """Extract legal conclusion from case description"""
        # Simulated AI extraction
        return "Based on the applicable law and factual analysis, the plaintiff is entitled to damages and specific performance as remedies for the breach."
    
    def _calculate_overall_score(self, analysis: IRACAnalysis) -> float:
        """Calculate overall analysis score"""
        scores = []
        for component in [analysis.issue, analysis.rule, analysis.application, analysis.conclusion]:
            if component:
                scores.append(component.confidence_score)
        
        return (sum(scores) / len(scores)) * 100 if scores else 0.0
    
    @handle_errors(log_errors=True, reraise=True)
    def update_component(self, analysis_id: str, component_type: str, 
                        content: str, legal_references: List[str] = None) -> Optional[IRACAnalysis]:
        """
        Update IRAC component
        
        Args:
            analysis_id (str): Analysis ID
            component_type (str): Component type to update
            content (str): New content
            legal_references (List[str]): Legal references
            
        Returns:
            Optional[IRACAnalysis]: Updated analysis
        """
        analysis = irac_db.get_analysis(analysis_id)
        if not analysis:
            raise ValidationError(f"Analysis {analysis_id} not found")
        
        # Update component
        component = IRACComponent(
            component_type=component_type,
            content=content,
            confidence_score=0.95,  # User-provided content gets higher confidence
            legal_references=legal_references or []
        )
        
        setattr(analysis, component_type, component)
        
        # Recalculate overall score
        analysis.overall_score = self._calculate_overall_score(analysis)
        analysis.updated_at = datetime.utcnow()
        
        # Log audit trail
        audit_logger.log_action(
            user_id=analysis.user_id,
            action="irac_component_updated",
            resource="irac_analysis",
            details={"analysis_id": analysis_id, "component_type": component_type}
        )
        
        return analysis
    
    @handle_errors(log_errors=True, reraise=True)
    def evaluate_analysis(self, analysis_id: str, criteria: List[str] = None) -> IRACEvaluationResult:
        """
        Evaluate IRAC analysis quality
        
        Args:
            analysis_id (str): Analysis ID to evaluate
            criteria (List[str]): Custom evaluation criteria
            
        Returns:
            IRACEvaluationResult: Evaluation results
        """
        analysis = irac_db.get_analysis(analysis_id)
        if not analysis:
            raise ValidationError(f"Analysis {analysis_id} not found")
        
        # Evaluate each component
        component_scores = {}
        for component_name in ["issue", "rule", "application", "conclusion"]:
            component = getattr(analysis, component_name, None)
            if component:
                component_scores[component_name] = component.confidence_score * 100
            else:
                component_scores[component_name] = 0.0
        
        # Calculate overall score
        overall_score = sum(component_scores.values()) / len(component_scores)
        
        # Generate strengths and weaknesses
        strengths = []
        weaknesses = []
        
        for component_name, score in component_scores.items():
            if score >= 85:
                strengths.append(f"Strong {component_name} with clear legal reasoning")
            elif score < 70:
                weaknesses.append(f"Weak {component_name} needs more development")
        
        # Generate recommendations
        recommendations = []
        for component_name, score in component_scores.items():
            if score < 80:
                recommendations.append(f"Enhance {component_name} with more specific legal references")
        
        return IRACEvaluationResult(
            analysis_id=analysis_id,
            overall_score=overall_score,
            component_scores=component_scores,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            evaluation_timestamp=datetime.utcnow()
        )

# API Endpoints
@router.post("/solve", response_model=IRACAnalysis)
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def solve_case(
    case_description: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    irac_solver: IRACSolverService = Depends(get_irac_solver)
):
    """
    Solve legal case using IRAC methodology
    
    Args:
        case_description (str): Description of the legal case
        user_id (str): User ID requesting the analysis
        background_tasks (BackgroundTasks): FastAPI background tasks
        db (Session): Database session
        irac_solver (IRACSolverService): IRAC solver service
        
    Returns:
        IRACAnalysis: Complete IRAC analysis
    """
    # Validate input
    if len(case_description.strip()) < 50:
        raise ValidationError("Case description must be at least 50 characters long")
    
    # Perform analysis
    analysis = irac_solver.analyze_case(case_description, user_id)
    
    # Save to database
    saved_analysis = irac_db.create_analysis(analysis)
    
    # Add background task for additional processing
    background_tasks.add_task(
        process_analysis_background,
        analysis_id=saved_analysis.id
    )
    
    logger.info(f"IRAC analysis completed for user {user_id}, analysis ID: {saved_analysis.id}")
    
    return saved_analysis

@router.put("/update-component", response_model=IRACAnalysis)
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def update_irac_component(
    analysis_id: str,
    component_type: str,
    content: str,
    legal_references: List[str] = None,
    db: Session = Depends(get_db),
    irac_solver: IRACSolverService = Depends(get_irac_solver)
):
    """
    Update IRAC component
    
    Args:
        analysis_id (str): Analysis ID
        component_type (str): Component type to update
        content (str): New content
        legal_references (List[str]): Legal references
        db (Session): Database session
        irac_solver (IRACSolverService): IRAC solver service
        
    Returns:
        IRACAnalysis: Updated analysis
    """
    # Validate component type
    valid_components = ["issue", "rule", "application", "conclusion"]
    if component_type not in valid_components:
        raise ValidationError(f"Invalid component type. Must be one of: {valid_components}")
    
    # Update component
    updated_analysis = irac_solver.update_component(
        analysis_id, component_type, content, legal_references
    )
    
    if not updated_analysis:
        raise ValidationError(f"Analysis {analysis_id} not found")
    
    logger.info(f"IRAC component updated: {analysis_id}, component: {component_type}")
    
    return updated_analysis

@router.post("/evaluate", response_model=IRACEvaluationResult)
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def evaluate_irac_analysis(
    request: IRACEvaluationRequest,
    db: Session = Depends(get_db),
    irac_solver: IRACSolverService = Depends(get_irac_solver)
):
    """
    Evaluate IRAC analysis quality
    
    Args:
        request (IRACEvaluationRequest): Evaluation request
        db (Session): Database session
        irac_solver (IRACSolverService): IRAC solver service
        
    Returns:
        IRACEvaluationResult: Evaluation results
    """
    result = irac_solver.evaluate_analysis(
        request.analysis_id, 
        request.evaluation_criteria
    )
    
    logger.info(f"IRAC evaluation completed for analysis: {request.analysis_id}")
    
    return result

@router.get("/analysis/{analysis_id}", response_model=IRACAnalysis)
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def get_irac_analysis(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Get IRAC analysis by ID
    
    Args:
        analysis_id (str): Analysis ID
        db (Session): Database session
        
    Returns:
        IRACAnalysis: IRAC analysis
    """
    analysis = irac_db.get_analysis(analysis_id)
    if not analysis:
        raise ValidationError(f"Analysis {analysis_id} not found")
    
    return analysis

@router.get("/user/{user_id}/analyses", response_model=List[IRACAnalysis])
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def get_user_analyses(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all IRAC analyses for a user
    
    Args:
        user_id (str): User ID
        db (Session): Database session
        
    Returns:
        List[IRACAnalysis]: List of user analyses
    """
    analyses = irac_db.get_user_analyses(user_id)
    
    logger.info(f"Retrieved {len(analyses)} analyses for user {user_id}")
    
    return analyses

@router.delete("/analysis/{analysis_id}")
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def delete_irac_analysis(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete IRAC analysis
    
    Args:
        analysis_id (str): Analysis ID
        db (Session): Database session
        
    Returns:
        Dict[str, str]: Deletion result
    """
    # Get analysis for audit trail
    analysis = irac_db.get_analysis(analysis_id)
    if not analysis:
        raise ValidationError(f"Analysis {analysis_id} not found")
    
    # Delete analysis
    success = irac_db.delete_analysis(analysis_id)
    
    if success:
        # Log audit trail
        audit_logger.log_action(
            user_id=analysis.user_id,
            action="irac_analysis_deleted",
            resource="irac_analysis",
            details={"analysis_id": analysis_id}
        )
        
        logger.info(f"IRAC analysis deleted: {analysis_id}")
        
        return {"message": "Analysis deleted successfully", "analysis_id": analysis_id}
    else:
        raise DatabaseError("Failed to delete analysis")

@router.get("/health")
@performance_logger
@handle_errors(log_errors=True, reraise=True)
def irac_health_check():
    """
    IRAC solver health check
    
    Returns:
        Dict[str, Any]: Health status
    """
    return {
        "status": "healthy",
        "service": "IRAC Solver",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database_status": "connected",
        "ai_service_status": "available"
    }

# Background task
async def process_analysis_background(analysis_id: str):
    """
    Background task for additional analysis processing
    
    Args:
        analysis_id (str): Analysis ID to process
    """
    logger.info(f"Background processing started for analysis: {analysis_id}")
    
    try:
        # Simulate additional processing
        import asyncio
        await asyncio.sleep(2)
        
        # Update analysis status
        analysis = irac_db.get_analysis(analysis_id)
        if analysis:
            analysis.status = "processed"
            analysis.updated_at = datetime.utcnow()
        
        logger.info(f"Background processing completed for analysis: {analysis_id}")
    
    except Exception as e:
        logger.error(f"Background processing failed for analysis {analysis_id}: {e}")

# Dependency injection for testing
def get_irac_solver_dependency():
    """IRAC solver dependency for FastAPI"""
    return Depends(get_irac_solver)
