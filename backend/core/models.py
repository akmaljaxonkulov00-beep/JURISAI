"""
Database Models
O'zbekiston qonunchiligiga moslashgan ma'lumotlar bazasi modellari
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
import uuid

Base = declarative_base()

class UserRole(PyEnum):
    """Foydalanuvchi rollari"""
    STUDENT = "student"
    TEACHER = "teacher"
    LAWYER = "lawyer"
    JUDGE = "judge"
    ADMIN = "admin"

class CaseType(PyEnum):
    """Case turlari"""
    CIVIL = "civil"
    CRIMINAL = "criminal"
    FAMILY = "family"
    LABOR = "labor"
    ADMINISTRATIVE = "administrative"

class AnalysisStatus(PyEnum):
    """Tahlil statuslari"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    """Foydalanuvchi modeli"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relatsiyalar
    irac_analyses = relationship("IRACAnalysis", back_populates="user")
    court_sessions = relationship("CourtSession", back_populates="user")
    legal_documents = relationship("LegalDocument", back_populates="user")
    decision_trees = relationship("DecisionTree", back_populates="user")

class IRACAnalysis(Base):
    """IRAC tahlili modeli"""
    __tablename__ = "irac_analyses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    case_text = Column(Text, nullable=False)
    case_type = Column(Enum(CaseType), nullable=False)
    difficulty_level = Column(String, default="medium")
    
    # IRAC komponentlari
    issue = Column(Text, nullable=True)
    rule = Column(Text, nullable=True)
    application = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    
    # Baholash
    issue_score = Column(Float, default=0.0)
    rule_score = Column(Float, default=0.0)
    application_score = Column(Float, default=0.0)
    conclusion_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    
    # AI tahlili
    ai_feedback = Column(Text, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    processing_time = Column(Float, default=0.0)
    
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relatsiyalar
    user = relationship("User", back_populates="irac_analyses")

class LegalDocument(Base):
    """Huquqiy hujjat modeli"""
    __tablename__ = "legal_documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    document_type = Column(String, nullable=False)  # shartnoma, ariza, hujjat turi
    template_id = Column(String, nullable=True)
    
    # Metadata
    metadata = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)  # taglar ro'yxati
    
    # Status
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    is_public = Column(Boolean, default=False)
    
    # Vaqt
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relatsiyalar
    user = relationship("User", back_populates="legal_documents")

class CourtSession(Base):
    """Virtual sud sessiyasi modeli"""
    __tablename__ = "court_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_name = Column(String, nullable=False)
    scenario_type = Column(Enum(CaseType), nullable=False)
    user_role = Column(String, nullable=False)  # judge, prosecutor, defendant, lawyer
    
    # Sessiya ma'lumotlari
    participants = Column(JSON, nullable=True)  # ishtirokchilar ro'yxati
    case_data = Column(JSON, nullable=True)  # ish ma'lumotlari
    transcript = Column(Text, nullable=True)  # transkript
    
    # Qarorlar
    final_decision = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    user_performance_score = Column(Float, default=0.0)
    
    # Status
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relatsiyalar
    user = relationship("User", back_populates="court_sessions")

class DecisionTree(Base):
    """Qaror daraxti modeli"""
    __tablename__ = "decision_trees"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    scenario_title = Column(String, nullable=False)
    scenario_description = Column(Text, nullable=False)
    
    # Daraxt strukturasi
    tree_data = Column(JSON, nullable=True)  # daraxt ma'lumotlari
    current_node = Column(String, nullable=True)  # joriy node
    path_taken = Column(JSON, nullable=True)  # o'tilgan yo'l
    
    # Qarorlar
    final_decision = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0)
    risk_assessment = Column(JSON, nullable=True)
    
    # AI tahlili
    ai_recommendations = Column(JSON, nullable=True)
    processing_time = Column(Float, default=0.0)
    
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relatsiyalar
    user = relationship("User", back_populates="decision_trees")

class LegalTemplate(Base):
    """Huquqiy shablon modeli"""
    __tablename__ = "legal_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    template_type = Column(String, nullable=False)  # shartnoma, ariza, hujjat turi
    content = Column(Text, nullable=False)
    
    # Maydonlar
    fields = Column(JSON, nullable=True)  # shablon maydonlari
    validation_rules = Column(JSON, nullable=True)  # validatsiya qoidalari
    
    # Metadata
    category = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserProgress(Base):
    """Foydalanuvchi progressi modeli"""
    __tablename__ = "user_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_type = Column(String, nullable=False)  # irac, court, decision_tree, etc.
    module_id = Column(String, nullable=False)
    
    # Progress ma'lumotlari
    completion_percentage = Column(Float, default=0.0)
    score = Column(Float, default=0.0)
    time_spent = Column(Integer, default=0)  # sekundlarda
    
    # Badges va yutuqlar
    badges_earned = Column(JSON, nullable=True)
    achievements = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemLog(Base):
    """System log modeli"""
    __tablename__ = "system_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    
    # Metadata
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    additional_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
