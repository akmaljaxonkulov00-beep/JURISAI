#!/usr/bin/env python3
"""
JurisAI Backend Server
FastAPI server for AI-powered legal education platform
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic Models
class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    created_at: str
    last_login: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class APIResponse(BaseModel):
    data: Any
    message: str
    success: bool
    error: Optional[str] = None

# AI Service Models
class IRACAnalysisRequest(BaseModel):
    case_text: str
    difficulty: str

class IRACAnalysisResponse(BaseModel):
    issue: str
    rule: str
    application: str
    conclusion: str
    score: int
    feedback: str
    processing_time: float

class DocumentGenerationRequest(BaseModel):
    template: str
    data: Dict[str, Any]

class DocumentGenerationResponse(BaseModel):
    content: str
    template: str
    metadata: Dict[str, Any]
    processing_time: float

class WeaknessDetectionRequest(BaseModel):
    argument: str
    argument_type: str

class WeaknessDetectionResponse(BaseModel):
    weaknesses: List[Dict[str, Any]]
    overall_score: int
    feedback: str
    processing_time: float

class ScenarioGenerationRequest(BaseModel):
    scenario_type: str
    difficulty: str
    complexity: str

class ScenarioGenerationResponse(BaseModel):
    scenario: Dict[str, Any]
    metadata: Dict[str, Any]
    processing_time: float

# Mock data storage
users_db = {}
sessions_db = {}

# AI Service Functions
def analyze_irac(case_text: str, difficulty: str) -> IRACAnalysisResponse:
    """Mock IRAC analysis"""
    import random
    import time
    
    time.sleep(1)  # Simulate processing time
    
    return IRACAnalysisResponse(
        issue=f"Analyzing issue for case with difficulty {difficulty}",
        rule="Applying relevant legal rules and precedents",
        application="Applying rules to the specific case facts",
        conclusion="Drawing logical conclusion based on analysis",
        score=random.randint(70, 95),
        feedback="Good analysis with room for improvement in legal reasoning",
        processing_time=1.2
    )

def generate_document(template: str, data: Dict[str, Any]) -> DocumentGenerationResponse:
    """Mock document generation"""
    import random
    import time
    
    time.sleep(1.5)  # Simulate processing time
    
    return DocumentGenerationResponse(
        content=f"Generated {template} document with data: {data}",
        template=template,
        metadata={"pages": random.randint(3, 10), "word_count": random.randint(500, 2000)},
        processing_time=1.5
    )

def detect_weaknesses(argument: str, argument_type: str) -> WeaknessDetectionResponse:
    """Mock weakness detection"""
    import random
    import time
    
    time.sleep(1.3)  # Simulate processing time
    
    weaknesses = [
        {
            "type": "logical_fallacy",
            "severity": "medium",
            "description": "Some logical inconsistencies detected",
            "suggestion": "Review logical flow and consistency"
        },
        {
            "type": "insufficient_evidence",
            "severity": "low",
            "description": "Could use more supporting evidence",
            "suggestion": "Add more concrete examples and evidence"
        }
    ]
    
    return WeaknessDetectionResponse(
        weaknesses=weaknesses,
        score=random.randint(65, 85),
        feedback="Argument has some weaknesses but overall structure is good",
        processing_time=1.3
    )

def generate_scenario(scenario_type: str, difficulty: str, complexity: str) -> ScenarioGenerationResponse:
    """Mock scenario generation"""
    import random
    import time
    
    time.sleep(2)  # Simulate processing time
    
    scenario = {
        "title": f"Generated {scenario_type} scenario",
        "difficulty": difficulty,
        "complexity": complexity,
        "background": "This is a mock scenario for educational purposes",
        "facts": ["Fact 1", "Fact 2", "Fact 3"],
        "legal_issues": ["Issue 1", "Issue 2"]
    }
    
    return ScenarioGenerationResponse(
        scenario=scenario,
        metadata={"estimated_time": random.randint(30, 90), "learning_objectives": 5},
        processing_time=2.0
    )

# Authentication functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = users_db.get(user_id)
    if user is None:
        raise credentials_exception
    return user

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("JurisAI Backend Server Starting...")
    
    # Create default user
    if "default_user" not in users_db:
        users_db["default_user"] = {
            "id": "default_user",
            "name": "Demo User",
            "email": "demo@jurisai.uz",
            "password_hash": get_password_hash("demo123"),
            "role": "student",
            "created_at": datetime.now().isoformat()
        }
    
    yield
    
    # Shutdown
    logger.info("JurisAI Backend Server Shutting Down...")

app = FastAPI(
    title="JurisAI API",
    description="AI-powered legal education platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function for API responses
def create_response(data: Any, message: str = "Success", success: bool = True, error: Optional[str] = None):
    return APIResponse(data=data, message=message, success=success, error=error)

# Health check
@app.get("/api/health", response_model=APIResponse)
async def health_check():
    """Health check endpoint"""
    return create_response(
        data={"status": "healthy", "timestamp": datetime.now().isoformat()},
        message="JurisAI API is running"
    )

# Authentication endpoints
@app.post("/api/auth/login", response_model=APIResponse)
async def login(user_data: UserLogin):
    """Login endpoint"""
    user = None
    for uid, u in users_db.items():
        if u["email"] == user_data.email:
            user = u
            break
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        return create_response(
            data=None,
            message="Invalid credentials",
            success=False,
            error="Email or password is incorrect"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = User(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        last_login=datetime.now().isoformat()
    )
    
    return create_response(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response.dict()
        },
        message="Login successful"
    )

@app.post("/api/auth/register", response_model=APIResponse)
async def register(user_data: UserCreate):
    """Register endpoint"""
    # Check if user already exists
    for uid, u in users_db.items():
        if u["email"] == user_data.email:
            return create_response(
                data=None,
                message="User already exists",
                success=False,
                error="Email already registered"
            )
    
    # Create new user
    user_id = f"user_{len(users_db) + 1}"
    users_db[user_id] = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "role": user_data.role or "student",
        "created_at": datetime.now().isoformat()
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    user_response = User(
        id=users_db[user_id]["id"],
        name=users_db[user_id]["name"],
        email=users_db[user_id]["email"],
        role=users_db[user_id]["role"],
        created_at=users_db[user_id]["created_at"]
    )
    
    return create_response(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response.dict()
        },
        message="Registration successful"
    )

@app.post("/api/auth/logout", response_model=APIResponse)
async def logout(current_user: Dict = Depends(get_current_user)):
    """Logout endpoint"""
    return create_response(data=None, message="Logout successful")

@app.post("/api/auth/refresh", response_model=APIResponse)
async def refresh_token(current_user: Dict = Depends(get_current_user)):
    """Refresh token endpoint"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user["id"]}, expires_delta=access_token_expires
    )
    
    return create_response(
        data={"access_token": access_token, "token_type": "bearer"},
        message="Token refreshed"
    )

# AI Service endpoints
@app.post("/api/ai/analyze", response_model=APIResponse)
async def analyze_text(request: Dict[str, str], current_user: Dict = Depends(get_current_user)):
    """Analyze text with AI"""
    text = request.get("text", "")
    analysis_type = request.get("type", "general")
    
    # Mock analysis
    return create_response(
        data={
            "analysis": f"AI analysis of {analysis_type} text",
            "confidence": 0.85,
            "processing_time": 1.2
        },
        message="Text analyzed successfully"
    )

@app.post("/api/ai/generate-document", response_model=APIResponse)
async def generate_document(request: DocumentGenerationRequest, current_user: Dict = Depends(get_current_user)):
    """Generate document"""
    result = generate_document(request.template, request.data)
    
    return create_response(
        data=result.dict(),
        message="Document generated successfully"
    )

@app.post("/api/ai/detect-weaknesses", response_model=APIResponse)
async def detect_weaknesses(request: WeaknessDetectionRequest, current_user: Dict = Depends(get_current_user)):
    """Detect weaknesses in argument"""
    result = detect_weaknesses(request.argument, request.argument_type)
    
    return create_response(
        data=result.dict(),
        message="Weaknesses detected successfully"
    )

@app.post("/api/ai/generate-scenario", response_model=APIResponse)
async def generate_scenario(request: ScenarioGenerationRequest, current_user: Dict = Depends(get_current_user)):
    """Generate legal scenario"""
    result = generate_scenario(request.scenario_type, request.difficulty, request.complexity)
    
    return create_response(
        data=result.dict(),
        message="Scenario generated successfully"
    )

# IRAC endpoints
@app.post("/api/irac/analyze", response_model=APIResponse)
async def analyze_irac(request: IRACAnalysisRequest, current_user: Dict = Depends(get_current_user)):
    """Analyze IRAC case"""
    result = analyze_irac(request.case_text, request.difficulty)
    
    return create_response(
        data=result.dict(),
        message="IRAC analysis completed"
    )

@app.post("/api/irac/evaluate/{analysis_id}", response_model=APIResponse)
async def evaluate_irac(analysis_id: str, current_user: Dict = Depends(get_current_user)):
    """Evaluate IRAC analysis"""
    return create_response(
        data={"evaluation": "IRAC evaluation completed", "score": 85},
        message="IRAC evaluation completed"
    )

@app.put("/api/irac/update/{analysis_id}", response_model=APIResponse)
async def update_irac(analysis_id: str, request: Dict[str, str], current_user: Dict = Depends(get_current_user)):
    """Update IRAC component"""
    return create_response(
        data={"updated": True, "component": request.get("component")},
        message="IRAC component updated"
    )

# Legal Database endpoints
@app.get("/api/legal/search", response_model=APIResponse)
async def search_legal_documents(q: str, category: Optional[str] = None, type: Optional[str] = None):
    """Search legal documents"""
    # Mock search results
    return create_response(
        data={
            "documents": [
                {
                    "id": "1",
                    "title": f"Search result for: {q}",
                    "type": "law",
                    "category": category or "civil",
                    "description": "Mock legal document"
                }
            ],
            "total_count": 1,
            "search_time": 0.8
        },
        message="Search completed"
    )

@app.get("/api/legal/documents/{doc_id}", response_model=APIResponse)
async def get_legal_document(doc_id: str):
    """Get specific legal document"""
    return create_response(
        data={
            "id": doc_id,
            "title": f"Document {doc_id}",
            "content": "Document content here...",
            "type": "law"
        },
        message="Document retrieved"
    )

@app.get("/api/legal/categories", response_model=APIResponse)
async def get_legal_categories():
    """Get legal categories"""
    return create_response(
        data={
            "categories": [
                {"id": "civil", "name": "Civil Law"},
                {"id": "criminal", "name": "Criminal Law"},
                {"id": "family", "name": "Family Law"},
                {"id": "labor", "name": "Labor Law"}
            ]
        },
        message="Categories retrieved"
    )

# Court Simulator endpoints
@app.post("/api/court/start-session", response_model=APIResponse)
async def start_court_session(request: Dict[str, str], current_user: Dict = Depends(get_current_user)):
    """Start court session"""
    session_id = f"session_{len(sessions_db) + 1}"
    
    sessions_db[session_id] = {
        "id": session_id,
        "scenario_type": request.get("scenario_type"),
        "user_role": request.get("user_role"),
        "status": "in_progress",
        "created_at": datetime.now().isoformat()
    }
    
    return create_response(
        data={
            "session_id": session_id,
            "status": "started",
            "scenario": "Mock court scenario"
        },
        message="Court session started"
    )

@app.post("/api/court/{session_id}/argument", response_model=APIResponse)
async def submit_court_argument(session_id: str, request: Dict[str, str], current_user: Dict = Depends(get_current_user)):
    """Submit court argument"""
    return create_response(
        data={"argument_submitted": True, "response": "AI response to argument"},
        message="Argument submitted successfully"
    )

@app.get("/api/court/{session_id}", response_model=APIResponse)
async def get_court_session(session_id: str):
    """Get court session details"""
    session = sessions_db.get(session_id)
    if not session:
        return create_response(
            data=None,
            message="Session not found",
            success=False,
            error="Session ID does not exist"
        )
    
    return create_response(
        data=session,
        message="Session retrieved"
    )

# Decision Tree endpoints
@app.post("/api/decision-tree/analyze", response_model=APIResponse)
async def analyze_decision_path(request: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """Analyze decision path"""
    return create_response(
        data={
            "final_decision": "Mock decision",
            "confidence": 0.85,
            "reasoning": "Mock reasoning"
        },
        message="Decision path analyzed"
    )

@app.get("/api/decision-tree/{scenario}", response_model=APIResponse)
async def get_decision_tree_nodes(scenario: str):
    """Get decision tree nodes"""
    return create_response(
        data={
            "nodes": [
                {"id": "root", "question": "Mock question", "options": ["Option 1", "Option 2"]}
            ]
        },
        message="Decision tree nodes retrieved"
    )

# Legal Forms endpoints
@app.post("/api/forms/submit", response_model=APIResponse)
async def submit_legal_form(request: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """Submit legal form"""
    return create_response(
        data={"form_id": f"form_{len(request) + 1}", "status": "submitted"},
        message="Form submitted successfully"
    )

@app.get("/api/forms/templates", response_model=APIResponse)
async def get_form_templates():
    """Get form templates"""
    return create_response(
        data={
            "templates": [
                {"id": "complaint", "name": "Complaint Form", "fields": ["name", "email", "description"]}
            ]
        },
        message="Templates retrieved"
    )

@app.get("/api/forms/templates/{template_id}", response_model=APIResponse)
async def get_form_template(template_id: str):
    """Get specific form template"""
    return create_response(
        data={
            "id": template_id,
            "name": f"Template {template_id}",
            "fields": ["field1", "field2", "field3"]
        },
        message="Template retrieved"
    )

@app.get("/api/forms/submitted", response_model=APIResponse)
async def get_submitted_forms(current_user: Dict = Depends(get_current_user)):
    """Get submitted forms"""
    return create_response(
        data={
            "forms": [
                {"id": "1", "template": "complaint", "status": "submitted", "submitted_at": datetime.now().isoformat()}
            ]
        },
        message="Submitted forms retrieved"
    )

# User Management endpoints
@app.get("/api/user/profile", response_model=APIResponse)
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """Get user profile"""
    return create_response(
        data={
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "created_at": current_user["created_at"]
        },
        message="Profile retrieved"
    )

@app.put("/api/user/profile", response_model=APIResponse)
async def update_user_profile(request: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """Update user profile"""
    return create_response(
        data={"updated": True},
        message="Profile updated"
    )

@app.get("/api/user/stats", response_model=APIResponse)
async def get_user_stats(current_user: Dict = Depends(get_current_user)):
    """Get user statistics"""
    return create_response(
        data={
            "irac_analyses": 10,
            "documents_generated": 5,
            "scenarios_completed": 3,
            "overall_score": 85
        },
        message="Stats retrieved"
    )

@app.get("/api/user/activity", response_model=APIResponse)
async def get_user_activity(current_user: Dict = Depends(get_current_user)):
    """Get user activity"""
    return create_response(
        data={
            "activities": [
                {"type": "irac_analysis", "timestamp": datetime.now().isoformat(), "score": 85}
            ]
        },
        message="Activity retrieved"
    )

# System endpoints
@app.get("/api/stats/system", response_model=APIResponse)
async def get_system_stats():
    """Get system statistics"""
    return create_response(
        data={
            "total_users": len(users_db),
            "active_sessions": len(sessions_db),
            "api_calls": 1000,
            "uptime": "24h"
        },
        message="System stats retrieved"
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "JurisAI API Server",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
