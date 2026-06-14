"""
Court Simulator Service
O'zbekiston sud simulyatsiyasi xizmati
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import random
import json
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

class SimulationPhase(Enum):
    """Simulyatsiya bosqichlari"""
    PREPARING = "preparing"
    OPENING_STATEMENTS = "opening_statements"
    PROSECUTION_CASE = "prosecution_case"
    DEFENSE_CASE = "defense_case"
    CROSS_EXAMINATION = "cross_examination"
    CLOSING_ARGUMENTS = "closing_arguments"
    JURY_DELIBERATION = "jury_deliberation"
    VERDICT = "verdict"
    COMPLETED = "completed"

class UserRole(Enum):
    """Foydalanuvchi rollari"""
    PROSECUTION = "prosecution"
    DEFENSE = "defense"
    JUDGE = "judge"
    JURY = "jury"

class CaseType(Enum):
    """Holat turlari"""
    CRIMINAL = "criminal"
    CIVIL = "civil"
    ADMINISTRATIVE = "administrative"

class DifficultyLevel(Enum):
    """Qiyinlik darajasi"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

@dataclass
class JudgeProfile:
    """Hakam profili"""
    id: str
    name: str
    experience_years: int
    specialization: str
    strictness_level: float
    bias_tendency: Optional[str]
    decision_speed: str
    reasoning_style: str

@dataclass
class LawyerProfile:
    """Advokat profili"""
    id: str
    name: str
    experience_years: int
    specialization: str
    success_rate: float
    argument_style: str
    preparation_level: float
    cross_examination_skill: float

@dataclass
class WitnessProfile:
    """Guvoh profili"""
    id: str
    name: str
    credibility: float
    nervousness_level: float
    memory_accuracy: float
    bias_tendency: Optional[str]
    confidence_level: float

@dataclass
class EvidenceItem:
    """Dalil"""
    id: str
    type: str
    title: str
    description: str
    credibility_score: float
    relevance_score: float
    authenticity_score: float
    presented_by: str

@dataclass
class CaseScenario:
    """Holat skripti"""
    id: str
    title: str
    case_type: str
    description: str
    legal_basis: List[str]
    difficulty_level: str
    estimated_duration: int
    key_issues: List[str]
    required_evidence: List[str]

@dataclass
class Simulation:
    """Simulyatsiya"""
    id: str
    user_id: str
    case_id: str
    user_role: str
    difficulty_level: str
    simulation_type: str
    status: str
    current_phase: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    participants: Dict[str, Any] = field(default_factory=dict)
    evidence: List[EvidenceItem] = field(default_factory=list)
    transcript: List[Dict[str, Any]] = field(default_factory=list)
    score: int = 0
    outcome: Optional[str] = None

class CourtSimulatorService:
    """Court Simulator Service - O'zbekiston sud tizimiga moslashgan"""
    
    def __init__(self):
        self.active_simulations: Dict[str, Simulation] = {}
        self.case_scenarios = self._create_case_scenarios()
        self.judge_profiles = self._create_judge_profiles()
        self.lawyer_profiles = self._create_lawyer_profiles()
        self.witness_profiles = self._create_witness_profiles()
        
        # O'zbekiston sud tizimi sozlamalari
        self.uzbekistan_court_system = {
            "criminal_procedure": {
                "standard_burden": "beyond reasonable doubt",
                "verdict_types": ["guilty", "not guilty", "acquitted"],
                "appeal_deadline_days": 10,
                "jury_system": False  # O'zbekistonda jury tizimi yo'q
            },
            "civil_procedure": {
                "standard_burden": "preponderance of evidence",
                "verdict_types": ["liable", "not liable", "settled"],
                "appeal_deadline_days": 30,
                "mediation_required": True
            },
            "administrative_procedure": {
                "standard_burden": "substantial evidence",
                "verdict_types": ["upheld", "reversed", "modified"],
                "appeal_deadline_days": 15,
                "expert_testimony": "often required"
            }
        }
    
    async def create_simulation(self, user_id: str, case_id: str, user_role: str, 
                             difficulty_level: str, simulation_type: str, 
                             custom_parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Yangi simulyatsiya yaratish
        
        Args:
            user_id: Foydalanuvchi ID
            case_id: Holat ID
            user_role: Foydalanuvchi roli
            difficulty_level: Qiyinlik darajasi
            simulation_type: Simulyatsiya turi
            custom_parameters: Qo'shimcha parametrlar
            
        Returns:
            Dict: Yaratilgan simulyatsiya ma'lumotlari
        """
        try:
            # Holatni olish
            case = next((c for c in self.case_scenarios if c.id == case_id), None)
            if not case:
                raise Exception("Holat topilmadi")
            
            # Simulyatsiya yaratish
            simulation_id = str(uuid.uuid4())
            simulation = Simulation(
                id=simulation_id,
                user_id=user_id,
                case_id=case_id,
                user_role=user_role,
                difficulty_level=difficulty_level,
                simulation_type=simulation_type,
                status="preparing",
                current_phase=SimulationPhase.PREPARING.value,
                created_at=datetime.utcnow()
            )
            
            # Ishtirokchilarni tayyorlash
            participants = await self._prepare_participants(case, user_role, difficulty_level)
            simulation.participants = participants
            
            # Dalillarni tayyorlash
            evidence = await self._prepare_evidence(case, difficulty_level)
            simulation.evidence = evidence
            
            # Simulyatsiyani saqlash
            self.active_simulations[simulation_id] = simulation
            
            # Boshlanish vaqtini hisoblash
            estimated_start = datetime.utcnow() + timedelta(seconds=30)
            
            logger.info(f"Simulation created: {simulation_id} for user {user_id}")
            
            return {
                "id": simulation_id,
                "estimated_start": estimated_start.isoformat(),
                "participants_count": len(participants),
                "evidence_count": len(evidence)
            }
            
        except Exception as e:
            logger.error(f"Create simulation error: {str(e)}")
            raise Exception(f"Simulyatsiyani yaratish xatolik: {str(e)}")
    
    async def get_simulation_status(self, simulation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Simulyatsiya holatini olish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Simulyatsiya holati
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                return None
            
            # Vaqtni hisoblash
            elapsed_time = 0
            remaining_time = None
            
            if simulation.started_at:
                elapsed_time = int((datetime.utcnow() - simulation.started_at).total_seconds())
                
                # Qolgan vaqtni hisoblash
                case = next((c for c in self.case_scenarios if c.id == simulation.case_id), None)
                if case:
                    total_duration = case.estimated_duration * 60  # sekundga o'tkazish
                    remaining_time = max(0, total_duration - elapsed_time)
            
            return {
                "simulation_id": simulation_id,
                "status": simulation.status,
                "current_phase": simulation.current_phase,
                "elapsed_time": elapsed_time,
                "remaining_time": remaining_time,
                "participants": simulation.participants,
                "current_speaker": self._get_current_speaker(simulation),
                "last_action": self._get_last_action(simulation)
            }
            
        except Exception as e:
            logger.error(f"Get simulation status error: {str(e)}")
            raise Exception(f"Holatni olish xatolik: {str(e)}")
    
    async def process_argument(self, simulation_id: str, user_id: str, 
                             argument_type: str, content: str, target_id: Optional[str],
                             evidence_references: List[str]) -> Dict[str, Any]:
        """
        Argumentni qayta ishlash
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            argument_type: Argument turi
            content: Mazmun
            target_id: Nishon ID
            evidence_references: Dalil havolalari
            
        Returns:
            Dict: Qayta ishlash natijasi
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            if simulation.status != "active":
                raise Exception("Simulyatsiya faol emas")
            
            # Argumentni qayta ishlash
            result = await self._analyze_argument(
                simulation, argument_type, content, target_id, evidence_references
            )
            
            # Transkriptga qo'shish
            simulation.transcript.append({
                "timestamp": datetime.utcnow().isoformat(),
                "speaker": simulation.user_role,
                "type": argument_type,
                "content": content,
                "evidence_references": evidence_references,
                "analysis": result
            })
            
            # Ballarni yangilash
            if result.get("quality_score", 0) > 0.7:
                simulation.score += int(result["quality_score"] * 10)
            
            # AI javobini generatsiya qilish
            ai_response = await self._generate_ai_response(simulation, argument_type, result)
            
            if ai_response:
                simulation.transcript.append(ai_response)
            
            # Bosqichni yangilash
            await self._update_simulation_phase(simulation)
            
            logger.info(f"Argument processed in simulation {simulation_id}")
            
            return {
                "success": True,
                "quality_score": result.get("quality_score", 0),
                "feedback": result.get("feedback", ""),
                "ai_response": ai_response,
                "updated_score": simulation.score,
                "next_phase": simulation.current_phase
            }
            
        except Exception as e:
            logger.error(f"Process argument error: {str(e)}")
            raise Exception(f"Argumentni qayta ishlash xatolik: {str(e)}")
    
    async def get_available_cases(self, case_type: Optional[str], difficulty: Optional[str]) -> List[Dict[str, Any]]:
        """
        Mavjud holatlarni olish
        
        Args:
            case_type: Holat turi
            difficulty: Qiyinlik darajasi
            
        Returns:
            List: Holatlar ro'yxati
        """
        try:
            cases = self.case_scenarios
            
            # Filtrlash
            if case_type:
                cases = [c for c in cases if c.case_type == case_type]
            
            if difficulty:
                cases = [c for c in cases if c.difficulty_level == difficulty]
            
            return [
                {
                    "id": case.id,
                    "title": case.title,
                    "case_type": case.case_type,
                    "description": case.description,
                    "difficulty_level": case.difficulty_level,
                    "estimated_duration": case.estimated_duration,
                    "key_issues": case.key_issues
                }
                for case in cases
            ]
            
        except Exception as e:
            logger.error(f"Get available cases error: {str(e)}")
            raise Exception(f"Holatlarni olish xatolik: {str(e)}")
    
    async def get_case_details(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Holat tafsilotlarini olish
        
        Args:
            case_id: Holat ID
            
        Returns:
            Dict: Holat tafsilotlari
        """
        try:
            case = next((c for c in self.case_scenarios if c.id == case_id), None)
            if not case:
                return None
            
            return {
                "id": case.id,
                "title": case.title,
                "case_type": case.case_type,
                "description": case.description,
                "legal_basis": case.legal_basis,
                "difficulty_level": case.difficulty_level,
                "estimated_duration": case.estimated_duration,
                "key_issues": case.key_issues,
                "required_evidence": case.required_evidence,
                "court_rules": self._get_court_rules(case.case_type)
            }
            
        except Exception as e:
            logger.error(f"Get case details error: {str(e)}")
            raise Exception(f"Holat tafsilotlarini olish xatolik: {str(e)}")
    
    async def get_simulation_participants(self, simulation_id: str, user_id: str) -> Dict[str, Any]:
        """
        Simulyatsiya ishtirokchilarini olish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Ishtirokchilar
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            return simulation.participants
            
        except Exception as e:
            logger.error(f"Get simulation participants error: {str(e)}")
            raise Exception(f"Ishtirokchilarni olish xatolik: {str(e)}")
    
    async def get_simulation_evidence(self, simulation_id: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Simulyatsiya dalillarini olish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            List: Dalillar
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            return [
                {
                    "id": evidence.id,
                    "type": evidence.type,
                    "title": evidence.title,
                    "description": evidence.description,
                    "credibility_score": evidence.credibility_score,
                    "relevance_score": evidence.relevance_score,
                    "authenticity_score": evidence.authenticity_score,
                    "presented_by": evidence.presented_by
                }
                for evidence in simulation.evidence
            ]
            
        except Exception as e:
            logger.error(f"Get simulation evidence error: {str(e)}")
            raise Exception(f"Dalillarni olish xatolik: {str(e)}")
    
    async def pause_simulation(self, simulation_id: str, user_id: str) -> Dict[str, str]:
        """
        Simulyatsiyani to'xtatish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Natija
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            if simulation.status == "active":
                simulation.status = "paused"
                
                logger.info(f"Simulation {simulation_id} paused by user {user_id}")
                return {"message": "Simulyatsiya to'xtatildi"}
            else:
                return {"message": "Simulyatsiya allaqachon to'xtatilgan"}
                
        except Exception as e:
            logger.error(f"Pause simulation error: {str(e)}")
            raise Exception(f"Simulyatsiyani to'xtatish xatolik: {str(e)}")
    
    async def resume_simulation(self, simulation_id: str, user_id: str) -> Dict[str, str]:
        """
        Simulyatsiyani davom ettirish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Natija
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            if simulation.status == "paused":
                simulation.status = "active"
                
                logger.info(f"Simulation {simulation_id} resumed by user {user_id}")
                return {"message": "Simulyatsiya davom ettirildi"}
            else:
                return {"message": "Simulyatsiya faol emas"}
                
        except Exception as e:
            logger.error(f"Resume simulation error: {str(e)}")
            raise Exception(f"Simulyatsiyani davom ettirish xatolik: {str(e)}")
    
    async def end_simulation(self, simulation_id: str, user_id: str) -> Dict[str, Any]:
        """
        Simulyatsiyani tugatish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Natijalar
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            # Natijalarni hisoblash
            results = await self._calculate_final_results(simulation)
            
            # Simulyatsiyani tugatish
            simulation.status = "completed"
            simulation.ended_at = datetime.utcnow()
            simulation.outcome = results["outcome"]
            simulation.score = results["score"]
            
            logger.info(f"Simulation {simulation_id} completed with outcome: {results['outcome']}")
            
            return results
            
        except Exception as e:
            logger.error(f"End simulation error: {str(e)}")
            raise Exception(f"Simulyatsiyani tugatish xatolik: {str(e)}")
    
    async def get_user_simulation_history(self, user_id: str, limit: int, offset: int) -> List[Dict[str, Any]]:
        """
        Foydalanuvchi simulyatsiya tarixi
        
        Args:
            user_id: Foydalanuvchi ID
            limit: Limit
            offset: Offset
            
        Returns:
            List: Tarix
        """
        try:
            # Faol simulyatsiyalardan tarixni olish
            user_simulations = [
                sim for sim in self.active_simulations.values() 
                if sim.user_id == user_id
            ]
            
            # Tugallanganlarni filtrlash
            completed_simulations = [
                sim for sim in user_simulations 
                if sim.status == "completed"
            ]
            
            # Saralash
            completed_simulations.sort(
                key=lambda x: x.ended_at or datetime.min, 
                reverse=True
            )
            
            # Pagination
            paginated_simulations = completed_simulations[offset:offset + limit]
            
            return [
                {
                    "simulation_id": sim.id,
                    "case_title": next((c.title for c in self.case_scenarios if c.id == sim.case_id), ""),
                    "user_role": sim.user_role,
                    "difficulty_level": sim.difficulty_level,
                    "score": sim.score,
                    "outcome": sim.outcome,
                    "created_at": sim.created_at.isoformat(),
                    "ended_at": sim.ended_at.isoformat() if sim.ended_at else None
                }
                for sim in paginated_simulations
            ]
            
        except Exception as e:
            logger.error(f"Get user simulation history error: {str(e)}")
            raise Exception(f"Tarixni olish xatolik: {str(e)}")
    
    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Foydalanuvchi statistikasi
        
        Args:
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Statistika
        """
        try:
            # Foydalanuvchi simulyatsiyalari
            user_simulations = [
                sim for sim in self.active_simulations.values() 
                if sim.user_id == user_id
            ]
            
            # Umumiy statistika
            total_simulations = len(user_simulations)
            completed_simulations = len([sim for sim in user_simulations if sim.status == "completed"])
            
            # O'rtacha ball
            scores = [sim.score for sim in user_simulations if sim.status == "completed"]
            average_score = sum(scores) / len(scores) if scores else 0
            
            # Rol bo'yicha statistika
            role_stats = {}
            for sim in user_simulations:
                role = sim.user_role
                if role not in role_stats:
                    role_stats[role] = {"total": 0, "completed": 0, "avg_score": 0}
                role_stats[role]["total"] += 1
                if sim.status == "completed":
                    role_stats[role]["completed"] += 1
            
            # Natijalar bo'yicha statistika
            outcomes = [sim.outcome for sim in user_simulations if sim.outcome]
            outcome_stats = {}
            for outcome in outcomes:
                outcome_stats[outcome] = outcome_stats.get(outcome, 0) + 1
            
            return {
                "total_simulations": total_simulations,
                "completed_simulations": completed_simulations,
                "completion_rate": (completed_simulations / total_simulations * 100) if total_simulations > 0 else 0,
                "average_score": average_score,
                "highest_score": max(scores) if scores else 0,
                "role_statistics": role_stats,
                "outcome_statistics": outcome_stats,
                "last_simulation": max([sim.created_at for sim in user_simulations]).isoformat() if user_simulations else None
            }
            
        except Exception as e:
            logger.error(f"Get user statistics error: {str(e)}")
            raise Exception(f"Statistikani olish xatolik: {str(e)}")
    
    async def submit_feedback(self, simulation_id: str, user_id: str, feedback_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Fikr-mulohaza yuborish
        
        Args:
            simulation_id: Simulyatsiya ID
            user_id: Foydalanuvchi ID
            feedback_data: Fikr-mulohaza ma'lumotlari
            
        Returns:
            Dict: Natija
        """
        try:
            simulation = self.active_simulations.get(simulation_id)
            if not simulation or simulation.user_id != user_id:
                raise Exception("Simulyatsiya topilmadi")
            
            # Fikr-mulohazani saqlash (bu yerda faqat log qilamiz)
            logger.info(f"Feedback submitted for simulation {simulation_id}: {feedback_data}")
            
            return {"message": "Fikr-mulohaza qabul qilindi"}
            
        except Exception as e:
            logger.error(f"Submit feedback error: {str(e)}")
            raise Exception(f"Fikr-mulohazani yuborish xatolik: {str(e)}")
    
    async def get_leaderboard(self, period: str, limit: int) -> List[Dict[str, Any]]:
        """
        Eng yaxshi natijalar
        
        Args:
            period: Davr
            limit: Limit
            
        Returns:
            List: Eng yaxshi natijalar
        """
        try:
            # Barcha tugallangan simulyatsiyalar
            all_simulations = [
                sim for sim in self.active_simulations.values() 
                if sim.status == "completed"
            ]
            
            # Davr bo'yicha filtrlash
            if period == "daily":
                cutoff = datetime.utcnow() - timedelta(days=1)
            elif period == "weekly":
                cutoff = datetime.utcnow() - timedelta(weeks=1)
            elif period == "monthly":
                cutoff = datetime.utcnow() - timedelta(days=30)
            else:  # all_time
                cutoff = datetime.min
            
            filtered_simulations = [
                sim for sim in all_simulations 
                if sim.ended_at and sim.ended_at > cutoff
            ]
            
            # Foydalanuvchi bo'yicha guruhlash
            user_scores = {}
            for sim in filtered_simulations:
                user_id = sim.user_id
                if user_id not in user_scores:
                    user_scores[user_id] = []
                user_scores[user_id].append(sim.score)
            
            # O'rtacha ballarni hisoblash
            user_averages = []
            for user_id, scores in user_scores.items():
                avg_score = sum(scores) / len(scores)
                user_averages.append({
                    "user_id": user_id,
                    "average_score": avg_score,
                    "total_simulations": len(scores),
                    "highest_score": max(scores)
                })
            
            # Saralash
            user_averages.sort(key=lambda x: x["average_score"], reverse=True)
            
            return user_averages[:limit]
            
        except Exception as e:
            logger.error(f"Get leaderboard error: {str(e)}")
            raise Exception(f"Eng yaxshi natijalarni olish xatolik: {str(e)}")
    
    # Private methods
    def _create_case_scenarios(self) -> List[CaseScenario]:
        """Holat skriptlarini yaratish"""
        return [
            CaseScenario(
                id="criminal_theft",
                title="O'g'irlik holati",
                case_type="criminal",
                description="Mulkni o'g'rilash holati bo'yicha jinoyat ishi",
                legal_basis=["JK 169-modda", "JPK 77-modda"],
                difficulty_level="beginner",
                estimated_duration=45,
                key_issues=["dalil etishmasligi", "shubhali guvoh", "moddiy dalillar"],
                required_evidence=["guvoh bayoni", "video yozuv", "ekspert xulosasi"]
            ),
            CaseScenario(
                id="civil_contract",
                title="Shartnoma buzilishi",
                case_type="civil",
                description="Tijorat shartnomasini buzish holati",
                legal_basis=["FK 345-modda", "FK 347-modda"],
                difficulty_level="intermediate",
                estimated_duration=60,
                key_issues=["shartnoma shartlari", "zarar miqdori", "neustoyka"],
                required_evidence=["shartnoma", "xatlar", "hisob-fakturalar"]
            ),
            CaseScenario(
                id="administrative_violation",
                title="Ma'muriy huquqbuzarlik",
                case_type="administrative",
                description="Soliq to'lamaslik holati",
                legal_basis=["MK 81-modda", "SK 226-modda"],
                difficulty_level="advanced",
                estimated_duration=90,
                key_issues=["soliq qonuni", "jarima miqdori", "murojaat muddati"],
                required_evidence=["soliq deklaratsiyasi", "bank hisobotlari", "inspektsiya akti"]
            )
        ]
    
    def _create_judge_profiles(self) -> List[JudgeProfile]:
        """Hakam profillarini yaratish"""
        return [
            JudgeProfile(
                id="judge_1",
                name="Karimov O.T.",
                experience_years=15,
                specialization="jinoyat",
                strictness_level=0.7,
                bias_tendency=None,
                decision_speed="medium",
                reasoning_style="formal"
            ),
            JudgeProfile(
                id="judge_2",
                name="Nazarova S.A.",
                experience_years=12,
                specialization="fuqarolik",
                strictness_level=0.5,
                bias_tendency=None,
                decision_speed="fast",
                reasoning_style="practical"
            ),
            JudgeProfile(
                id="judge_3",
                name="Toshmatov B.I.",
                experience_years=20,
                specialization="ma'muriy",
                strictness_level=0.8,
                bias_tendency=None,
                decision_speed="slow",
                reasoning_style="analytical"
            )
        ]
    
    def _create_lawyer_profiles(self) -> List[LawyerProfile]:
        """Advokat profillarini yaratish"""
        return [
            LawyerProfile(
                id="lawyer_1",
                name="Abdullayev D.R.",
                experience_years=8,
                specialization="jinoyat",
                success_rate=0.75,
                argument_style="aggressive",
                preparation_level=0.8,
                cross_examination_skill=0.7
            ),
            LawyerProfile(
                id="lawyer_2",
                name="Rashidova G.K.",
                experience_years=10,
                specialization="fuqarolik",
                success_rate=0.80,
                argument_style="diplomatic",
                preparation_level=0.9,
                cross_examination_skill=0.6
            ),
            LawyerProfile(
                id="lawyer_3",
                name="Saidov M.J.",
                experience_years=6,
                specialization="ma'muriy",
                success_rate=0.70,
                argument_style="analytical",
                preparation_level=0.7,
                cross_examination_skill=0.8
            )
        ]
    
    def _create_witness_profiles(self) -> List[WitnessProfile]:
        """Guvoh profillarini yaratish"""
        return [
            WitnessProfile(
                id="witness_1",
                name="Qosimov A.A.",
                credibility=0.8,
                nervousness_level=0.3,
                memory_accuracy=0.9,
                bias_tendency=None,
                confidence_level=0.7
            ),
            WitnessProfile(
                id="witness_2",
                name="Karimova N.T.",
                credibility=0.6,
                nervousness_level=0.7,
                memory_accuracy=0.5,
                bias_tendency="defense",
                confidence_level=0.4
            ),
            WitnessProfile(
                id="witness_3",
                name="Turgunov P.R.",
                credibility=0.9,
                nervousness_level=0.2,
                memory_accuracy=0.8,
                bias_tendency=None,
                confidence_level=0.8
            )
        ]
    
    async def _prepare_participants(self, case: CaseScenario, user_role: str, difficulty: str) -> Dict[str, Any]:
        """Ishtirokchilarni tayyorlash"""
        participants = {}
        
        # Hakam
        judge = random.choice(self.judge_profiles)
        participants["judge"] = {
            "id": judge.id,
            "name": judge.name,
            "role": "judge",
            "experience": judge.experience_years,
            "specialization": judge.specialization
        }
        
        # Advokatlar
        if user_role != "prosecution":
            prosecution_lawyer = random.choice(self.lawyer_profiles)
            participants["prosecution"] = {
                "id": prosecution_lawyer.id,
                "name": prosecution_lawyer.name,
                "role": "prosecution",
                "experience": prosecution_lawyer.experience_years,
                "success_rate": prosecution_lawyer.success_rate
            }
        
        if user_role != "defense":
            defense_lawyer = random.choice(self.lawyer_profiles)
            participants["defense"] = {
                "id": defense_lawyer.id,
                "name": defense_lawyer.name,
                "role": "defense",
                "experience": defense_lawyer.experience_years,
                "success_rate": defense_lawyer.success_rate
            }
        
        # Guvohlar
        witnesses = random.sample(self.witness_profiles, min(2, len(self.witness_profiles)))
        participants["witnesses"] = [
            {
                "id": witness.id,
                "name": witness.name,
                "role": "witness",
                "credibility": witness.credibility,
                "nervousness": witness.nervousness_level
            }
            for witness in witnesses
        ]
        
        return participants
    
    async def _prepare_evidence(self, case: CaseScenario, difficulty: str) -> List[EvidenceItem]:
        """Dalillarni tayyorlash"""
        evidence = []
        
        # Har bir holat uchun dalillar
        if case.id == "criminal_theft":
            evidence = [
                EvidenceItem(
                    id="evidence_1",
                    type="testimony",
                    title="Guvoh bayoni",
                    description="Voqea joyida bo'lgan guvoh bayoni",
                    credibility_score=0.7,
                    relevance_score=0.8,
                    authenticity_score=0.9,
                    presented_by="prosecution"
                ),
                EvidenceItem(
                    id="evidence_2",
                    type="digital",
                    title="Video yozuv",
                    description="Kuzatuv kamerasi yozuvi",
                    credibility_score=0.9,
                    relevance_score=0.9,
                    authenticity_score=0.8,
                    presented_by="prosecution"
                ),
                EvidenceItem(
                    id="evidence_3",
                    type="document",
                    title="Ekspert xulosasi",
                    description="Kriminalistik ekspert xulosasi",
                    credibility_score=0.8,
                    relevance_score=0.7,
                    authenticity_score=0.9,
                    presented_by="prosecution"
                )
            ]
        elif case.id == "civil_contract":
            evidence = [
                EvidenceItem(
                    id="evidence_1",
                    type="document",
                    title="Shartnoma",
                    description="Tijorat shartnomasi asl nusxasi",
                    credibility_score=0.9,
                    relevance_score=0.9,
                    authenticity_score=0.9,
                    presented_by="prosecution"
                ),
                EvidenceItem(
                    id="evidence_2",
                    type="document",
                    title="Xat almashinuvi",
                    description="Tomonlar o'rtasidagi xatlar",
                    credibility_score=0.8,
                    relevance_score=0.7,
                    authenticity_score=0.8,
                    presented_by="defense"
                )
            ]
        elif case.id == "administrative_violation":
            evidence = [
                EvidenceItem(
                    id="evidence_1",
                    type="document",
                    title="Soliq deklaratsiyasi",
                    description="Yillik soliq deklaratsiyasi",
                    credibility_score=0.9,
                    relevance_score=0.9,
                    authenticity_score=0.9,
                    presented_by="prosecution"
                ),
                EvidenceItem(
                    id="evidence_2",
                    type="document",
                    title="Bank hisobotlari",
                    description="Bank operatsiyalari hisoboti",
                    credibility_score=0.8,
                    relevance_score=0.8,
                    authenticity_score=0.7,
                    presented_by="prosecution"
                )
            ]
        
        # Qiyinlik darajasiga qarab dalillarni o'zgartirish
        if difficulty == "beginner":
            # Barcha dalillar aniq
            for ev in evidence:
                ev.credibility_score = max(0.8, ev.credibility_score)
        elif difficulty == "advanced":
            # Ba'zi dalillar shubhali
            for ev in evidence:
                ev.credibility_score *= 0.8
                ev.authenticity_score *= 0.9
        
        return evidence
    
    def _get_current_speaker(self, simulation: Simulation) -> Optional[str]:
        """Joriy so'zlovchini aniqlash"""
        if simulation.transcript:
            last_entry = simulation.transcript[-1]
            return last_entry.get("speaker")
        return None
    
    def _get_last_action(self, simulation: Simulation) -> Optional[str]:
        """Oxirgi harakatni olish"""
        if simulation.transcript:
            last_entry = simulation.transcript[-1]
            return f"{last_entry.get('speaker', '')}: {last_entry.get('type', '')}"
        return None
    
    async def _analyze_argument(self, simulation: Simulation, argument_type: str, 
                             content: str, target_id: Optional[str], 
                             evidence_references: List[str]) -> Dict[str, Any]:
        """Argumentni tahlil qilish"""
        # Soddalashtirilgan tahlil
        quality_score = random.uniform(0.5, 0.9)
        
        # Mazmun uzunligiga qarab ball
        if len(content) > 100:
            quality_score += 0.1
        elif len(content) < 50:
            quality_score -= 0.2
        
        # Dalillar havolasiga qarab ball
        if evidence_references:
            quality_score += len(evidence_references) * 0.05
        
        quality_score = min(1.0, quality_score)
        
        feedback = self._generate_feedback(argument_type, quality_score)
        
        return {
            "quality_score": quality_score,
            "feedback": feedback,
            "strengths": self._get_argument_strengths(content, evidence_references),
            "weaknesses": self._get_argument_weaknesses(content, evidence_references)
        }
    
    def _generate_feedback(self, argument_type: str, quality_score: float) -> str:
        """Fikr-mulohaza generatsiyasi"""
        feedback_templates = {
            "opening": [
                "Kirish so'zlari yaxshi tuzilgan, ammo ko'proq dalillar keltirish kerak.",
                "Kirish so'zlari aniq va mantiqiy, yaxshi boshlandi.",
                "Kirish so'zlari juda qisqa, to'liqroq bo'lishi kerak edi."
            ],
            "closing": [
                "Yakunlovchi so'zlari kuchli va ta'sirli.",
                "Yakunlovchi so'zlari o'rtacha, ko'proq tafakkur talab qiladi.",
                "Yakunlovchi so'zlari zaif, asosiy nuqtalarni takrorlash kerak."
            ],
            "objection": [
                "E'tiroz to'g'ri asoslangan.",
                "E'tiroz asosi shubhali, qo'shimcha dalillar kerak.",
                "E'tiroz noto'g'ri, sud qoidalariga zid."
            ]
        }
        
        templates = feedback_templates.get(argument_type, ["Argument qabul qilindi."])
        
        if quality_score > 0.8:
            return templates[0]
        elif quality_score > 0.6:
            return templates[1]
        else:
            return templates[2]
    
    def _get_argument_strengths(self, content: str, evidence_refs: List[str]) -> List[str]:
        """Argumentning kuchli tomonlari"""
        strengths = []
        
        if len(content) > 100:
            strengths.append("Batafsil izoh")
        
        if evidence_refs:
            strengths.append("Dalillar bilan tasdiqlangan")
        
        if "qonun" in content.lower() or "modda" in content.lower():
            strengths.append("Qonunchilik asoslangan")
        
        return strengths
    
    def _get_argument_weaknesses(self, content: str, evidence_refs: List[str]) -> List[str]:
        """Argumentning zaif tomonlari"""
        weaknesses = []
        
        if len(content) < 50:
            weaknesses.append("Juda qisqa")
        
        if not evidence_refs:
            weaknesses.append("Dalillarsiz")
        
        if "men" in content.lower() and "fikrimcha" in content.lower():
            weaknesses.append("Shaxsiy fikr ko'p")
        
        return weaknesses
    
    async def _generate_ai_response(self, simulation: Simulation, argument_type: str, 
                                  analysis: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """AI javobini generatsiya qilish"""
        # Soddalashtirilgan AI javobi
        responses = {
            "prosecution": [
                "Ayblov tomoni sifatida, men dalillarning yetarli ekanligini ta'kidlayman.",
                "Ayblov tomoni bu argumentni qabul qilmaydi, chunki u asossiz.",
                "Ayblov tomoni qo'shimcha dalillar keltirishni so'raydi."
            ],
            "defense": [
                "Himoya tomoni sifatida, bu ayblovlarni rad etaman.",
                "Himoya tomoni bu dalillarni baholashni so'raydi.",
                "Himoya tomoni guvohni so'roq qilishni talab qiladi."
            ],
            "judge": [
                "Sud bu argumentni qabul qiladi.",
                "Sud bu haqda keyinroq qaror qiladi.",
                "Sud tomonga qo'shimcha savollar beradi."
            ]
        }
        
        # Qaysi tomondan javob berish kerakligini aniqlash
        if simulation.user_role == "prosecution":
            responder = "defense"
        elif simulation.user_role == "defense":
            responder = "prosecution"
        else:
            responder = random.choice(["prosecution", "defense"])
        
        response_templates = responses.get(responder, ["Javob berilmoqda..."])
        response_text = random.choice(response_templates)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "speaker": responder,
            "type": "response",
            "content": response_text,
            "analysis": {
                "response_type": "counter_argument",
                "relevance": random.uniform(0.6, 0.9)
            }
        }
    
    async def _update_simulation_phase(self, simulation: Simulation) -> None:
        """Simulyatsiya bosqichini yangilash"""
        phases = list(SimulationPhase)
        current_index = phases.index(SimulationPhase(simulation.current_phase))
        
        # Transkript uzunligiga qarab bosqichni o'tkazish
        transcript_length = len(simulation.transcript)
        
        if transcript_length < 3:
            simulation.current_phase = SimulationPhase.OPENING_STATEMENTS.value
        elif transcript_length < 8:
            simulation.current_phase = SimulationPhase.PROSECUTION_CASE.value
        elif transcript_length < 13:
            simulation.current_phase = SimulationPhase.DEFENSE_CASE.value
        elif transcript_length < 18:
            simulation.current_phase = SimulationPhase.CROSS_EXAMINATION.value
        elif transcript_length < 23:
            simulation.current_phase = SimulationPhase.CLOSING_ARGUMENTS.value
        else:
            simulation.current_phase = SimulationPhase.VERDICT.value
    
    async def _calculate_final_results(self, simulation: Simulation) -> Dict[str, Any]:
        """Yakuniy natijalarni hisoblash"""
        # Ballarni hisoblash
        base_score = simulation.score
        
        # Argument sifatiga qarab qo'shimcha ball
        quality_scores = [
            entry.get("analysis", {}).get("quality_score", 0)
            for entry in simulation.transcript
            if entry.get("analysis")
        ]
        
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        final_score = int(base_score + avg_quality * 50)
        
        # Natijani aniqlash
        if final_score > 80:
            outcome = "g'alaba"
        elif final_score > 60:
            outcome = "qoniqarli"
        else:
            outcome = "mag'lubiyat"
        
        # Fikr-mulohaza
        feedback = {
            "overall_performance": avg_quality,
            "argument_count": len(simulation.transcript),
            "evidence_usage": len([
                entry for entry in simulation.transcript 
                if entry.get("evidence_references")
            ]),
            "improvement_areas": self._get_improvement_areas(simulation),
            "strength_areas": self._get_strength_areas(simulation)
        }
        
        return {
            "outcome": outcome,
            "score": final_score,
            "feedback": feedback,
            "performance_metrics": {
                "argument_quality": avg_quality,
                "evidence_utilization": feedback["evidence_usage"] / len(simulation.transcript) if simulation.transcript else 0,
                "participation_level": len(simulation.transcript)
            },
            "recommendations": self._get_recommendations(simulation),
            "learning_points": self._get_learning_points(simulation)
        }
    
    def _get_improvement_areas(self, simulation: Simulation) -> List[str]:
        """Yaxshilash kerak bo'lgan sohalar"""
        areas = []
        
        transcript_length = len(simulation.transcript)
        if transcript_length < 10:
            areas.append("Ko'proq ishtirok etish")
        
        evidence_usage = len([
            entry for entry in simulation.transcript 
            if entry.get("evidence_references")
        ])
        if evidence_usage < 3:
            areas.append("Dalillardan ko'proq foydalanish")
        
        return areas
    
    def _get_strength_areas(self, simulation: Simulation) -> List[str]:
        """Kuchli tomonlar"""
        areas = []
        
        if simulation.score > 50:
            areas.append("Yaxshi argumentatsiya")
        
        if len(simulation.transcript) > 15:
            areas.append("Faol ishtirok")
        
        return areas
    
    def _get_recommendations(self, simulation: Simulation) -> List[str]:
        """Tavsiyalar"""
        recommendations = [
            "Qonun moddalarini ko'proq o'rganing",
            "Dalillarni to'g'ri keltirish mashq qiling",
            "Sud protsedurasini chuqurroq o'rganing"
        ]
        
        return recommendations[:3]
    
    def _get_learning_points(self, simulation: Simulation) -> List[str]:
        """O'rganish nuqtalari"""
        points = [
            "Sud ishida dalillar muhim ahamiyatga ega",
            "Argumentlar mantiqiy bo'lishi kerak",
            "Qonunga asoslangan dalolatlar kuchliroq"
        ]
        
        return points[:3]
    
    def _get_court_rules(self, case_type: str) -> Dict[str, Any]:
        """Sud qoidalari"""
        return self.uzbekistan_court_system.get(
            f"{case_type}_procedure", 
            {"standard_burden": "evidence", "verdict_types": ["accepted", "rejected"]}
        )
