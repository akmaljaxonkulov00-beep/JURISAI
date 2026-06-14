"""
Decision Tree Service
O'zbekiston qonunchiligiga moslashgan qaror daraxti analizi
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import re
import json
from dataclasses import dataclass, field
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class DecisionType(Enum):
    """Qaror turlari"""
    LEGAL_ACTION = "legal_action"
    DOCUMENT_FILING = "document_filing"
    COURT_PROCEEDING = "court_proceeding"
    NEGOTIATION = "negotiation"
    APPEAL = "appeal"

class RiskLevel(Enum):
    """Xavf darajalari"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class DecisionNode:
    """Qaror tuguni"""
    id: str
    title: str
    description: str
    decision_type: DecisionType
    options: List[Dict[str, Any]]
    risk_level: RiskLevel
    confidence_threshold: float
    legal_references: List[str]
    processing_time: float = 0.0

@dataclass
class DecisionPath:
    """Qaror yo'li"""
    node_id: str
    decision: str
    confidence: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    legal_implications: List[str] = field(default_factory=list)

@dataclass
class DecisionTreeResult:
    """Qaror daraxti natijasi"""
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
    timestamp: datetime = field(default_factory=datetime.utcnow)

class DecisionTreeService:
    """Decision Tree Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_framework = {
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "decision_points": [
                    "Shartnoma tuzish",
                    "Mulkiy nizolarni hal qilish",
                    "Vorislik masalalari",
                    "Shaxsiy huquqlarni himoya qilish",
                    "To'lov majburiyatlari"
                ]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "decision_points": [
                    "Jinoyat tarkibini aniqlash",
                    "Jazo turini tanlash",
                    "Protsedura boshlash",
                    "Dalillarni yig'ish",
                    "Himoya choralari"
                ]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "decision_points": [
                    "Nikoh masalalari",
                    "Bolalarning huquqlari",
                    "Ajralish protsedurasi",
                    "Aliment majburiyatlari",
                    "Oila mulki"
                ]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "decision_points": [
                    "Mehnat shartnomasi",
                    "Ish haqi masalalari",
                    "Ishdan bo'shatish",
                    "Ish xavfsizligi",
                    "Kollektiv shartnomalar"
                ]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "decision_points": [
                    "Ma'muriy jarayon",
                    "Jarima belgilash",
                    "Apellyatsiya berish",
                    "Protsedura qoidalari",
                    "Huquqbuzarlik turlari"
                ]
            }
        }
        
        # Qaror daraxti shablonlari
        self.decision_templates = {
            "contract_dispute": self._create_contract_dispute_template(),
            "inheritance_case": self._create_inheritance_template(),
            "employment_issue": self._create_employment_template(),
            "family_matter": self._create_family_template(),
            "criminal_case": self._create_criminal_template()
        }
    
    async def analyze_decision_path(self, scenario_title: str, scenario_description: str, case_type: str, initial_decisions: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Qaror daraxti analizini boshlash
        
        Args:
            scenario_title: Senariyo nomi
            scenario_description: Senariyo tavsifi
            case_type: Case turi
            initial_decisions: Dastlabki qarorlar
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Analiz natijalari
        """
        start_time = datetime.now()
        
        try:
            # Senariyo turini aniqlash
            scenario_type = self._classify_scenario(scenario_description, case_type)
            
            # Qaror daraxti shablonini tanlash
            template = self.decision_templates.get(scenario_type, self._create_generic_template())
            
            # Daraxt ma'lumotlarini yaratish
            tree_data = self._build_tree_structure(template, scenario_description, case_type)
            
            # Boshlang'ich tugunni aniqlash
            current_node = self._get_starting_node(tree_data)
            
            # Dastlabki qarorlarni qo'llash
            path_taken = self._apply_initial_decisions(tree_data, current_node, initial_decisions)
            
            # Xavf baholash
            risk_assessment = await self._assess_risks(tree_data, path_taken, case_type)
            
            # AI tavsiyalari
            ai_recommendations = await self._generate_ai_recommendations(scenario_description, path_taken, case_type)
            
            # Ishonch darajasini hisoblash
            confidence_score = self._calculate_confidence_score(path_taken, risk_assessment)
            
            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Natijani tayyorlash
            result = {
                "id": str(uuid.uuid4()),
                "scenario_title": scenario_title,
                "scenario_description": scenario_description,
                "tree_data": tree_data,
                "current_node": current_node,
                "path_taken": path_taken,
                "final_decision": None,
                "confidence_score": confidence_score,
                "risk_assessment": risk_assessment,
                "ai_recommendations": ai_recommendations,
                "processing_time": processing_time,
                "status": "in_progress"
            }
            
            logger.info(f"Decision tree analysis completed for user {user_id}, scenario: {scenario_title}")
            return result
            
        except Exception as e:
            logger.error(f"Decision tree analysis error: {str(e)}")
            raise Exception(f"Qaror daraxti tahlili xatolik: {str(e)}")
    
    async def update_decision_path(self, tree_id: str, node_id: str, decision: str, confidence: float) -> Dict[str, Any]:
        """
        Qaror yo'lini yangilash
        
        Args:
            tree_id: Daraxt ID
            node_id: Tugun ID
            decision: Qaror
            confidence: Ishonch darajasi
            
        Returns:
            Dict: Yangilangan natijalar
        """
        try:
            # Bu funksiya database dan daraxt ma'lumotlarini olishi kerak
            # Hozircha mock implementation
            updated_path = [node_id]
            updated_confidence = confidence
            
            return {
                "current_node": node_id,
                "path_taken": updated_path,
                "confidence_score": updated_confidence
            }
            
        except Exception as e:
            logger.error(f"Decision path update error: {str(e)}")
            raise Exception(f"Qaror yo'lini yangilash xatolik: {str(e)}")
    
    async def get_tree_nodes(self, scenario: str) -> List[Dict[str, Any]]:
        """
        Qaror daraxti tugunlarini olish
        
        Args:
            scenario: Senariyo turi
            
        Returns:
            List: Tugunlar ro'yxati
        """
        try:
            template = self.decision_templates.get(scenario, self._create_generic_template())
            
            nodes = []
            for node in template["nodes"]:
                nodes.append({
                    "id": node["id"],
                    "title": node["title"],
                    "description": node["description"],
                    "type": node["type"],
                    "options": node["options"],
                    "risk_level": node["risk_level"]
                })
            
            return nodes
            
        except Exception as e:
            logger.error(f"Get tree nodes error: {str(e)}")
            raise Exception(f"Tugunlarni olish xatolik: {str(e)}")
    
    async def evaluate_decision_tree(self, tree_id: str) -> Dict[str, Any]:
        """
        Qaror daraxtini baholash
        
        Args:
            tree_id: Daraxt ID
            
        Returns:
            Dict: Baholash natijalari
        """
        try:
            # Mock implementation
            confidence_score = 0.85
            risk_assessment = {
                "overall_risk": "medium",
                "legal_risks": ["muddati o'tgan", "hujjatlar to'liq emas"],
                "financial_risks": ["jarima", "kompensatsiya"],
                "reputation_risks": ["obro'sizlik"]
            }
            recommendations = [
                "Hujjatlarni to'ldirish",
                "Muddatni kuzatish",
                "Yuridik maslahat olish"
            ]
            
            return {
                "confidence_score": confidence_score,
                "risk_assessment": risk_assessment,
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Decision tree evaluation error: {str(e)}")
            raise Exception(f"Qaror daraxtini baholash xatolik: {str(e)}")
    
    def _classify_scenario(self, description: str, case_type: str) -> str:
        """Senariyo turini klassifikatsiya qilish"""
        description_lower = description.lower()
        
        if any(keyword in description_lower for keyword in ["shartnoma", "kontrakt", "kelishuv", "bitim"]):
            return "contract_dispute"
        elif any(keyword in description_lower for keyword in ["vorislik", "meros", "oyil", "merosxon"]):
            return "inheritance_case"
        elif any(keyword in description_lower for keyword in ["ish", "mehnat", "ishga qabul", "ishdan bo'shatish"]):
            return "employment_issue"
        elif any(keyword in description_lower for keyword in ["nikoh", "ajralish", "oilaviy", "bolalar", "aliment"]):
            return "family_matter"
        elif any(keyword in description_lower for keyword in ["jinoyat", "ayblov", "tergov", "sud"]):
            return "criminal_case"
        
        return "generic"
    
    def _build_tree_structure(self, template: Dict[str, Any], description: str, case_type: str) -> Dict[str, Any]:
        """Daraxt strukturasi qurish"""
        return {
            "template_type": template["type"],
            "nodes": template["nodes"],
            "edges": template["edges"],
            "case_type": case_type,
            "legal_framework": self.uzbekistan_legal_framework.get(case_type, {})
        }
    
    def _get_starting_node(self, tree_data: Dict[str, Any]) -> str:
        """Boshlang'ich tugunni olish"""
        nodes = tree_data.get("nodes", [])
        for node in nodes:
            if node.get("is_start", False):
                return node["id"]
        return nodes[0]["id"] if nodes else "root"
    
    def _apply_initial_decisions(self, tree_data: Dict[str, Any], current_node: str, initial_decisions: Dict[str, Any]) -> List[str]:
        """Dastlabki qarorlarni qo'llash"""
        path = [current_node]
        
        # Initial decisions ni qo'llash logikasi
        for decision_key, decision_value in initial_decisions.items():
            if decision_value:
                path.append(f"decision_{decision_key}")
        
        return path
    
    async def _assess_risks(self, tree_data: Dict[str, Any], path_taken: List[str], case_type: str) -> Dict[str, Any]:
        """Xavflarni baholash"""
        risks = {
            "overall_risk": "medium",
            "legal_risks": [],
            "financial_risks": [],
            "reputation_risks": [],
            "timeline_risks": []
        }
        
        # Case type ga qarab xavflarni aniqlash
        if case_type == "civil":
            risks["legal_risks"] = ["muddati o'tgan", "huquqbuzarlik"]
            risks["financial_risks"] = ["jarima", "kompensatsiya"]
        elif case_type == "criminal":
            risks["legal_risks"] = ["jazo", "huquqlardan mahrum qilish"]
            risks["reputation_risks"] = ["obro'sizlik"]
        elif case_type == "family":
            risks["legal_risks"] = ["bolalarning huquqlari"]
            risks["financial_risks"] = ["aliment", "mulk taqsimoti"]
        
        return risks
    
    async def _generate_ai_recommendations(self, description: str, path_taken: List[str], case_type: str) -> List[str]:
        """AI tavsiyalari generatsiyasi"""
        recommendations = []
        
        # Umumiy tavsiyalar
        recommendations.append("Hujjatlarni to'liq va to'g'ri rasmiylashtiring")
        recommendations.append("Muddatlarni qat'iy kuzatib boring")
        
        # Case type ga qarab tavsiyalar
        if case_type == "civil":
            recommendations.append("Taraflar o'rtasida muzokaralarni olib boring")
            recommendations.append("Notarius yordamidan foydalaning")
        elif case_type == "criminal":
            recommendations.append("Advokat xizmatlaridan foydalaning")
            recommendations.append("Dalillarni saqlab qoling")
        elif case_type == "family":
            recommendations.append("Bolalarning manfaatlarini birinchi o'ringa qo'ying")
            recommendations.append("Mediasiya xizmatlaridan foydalaning")
        
        return recommendations
    
    def _calculate_confidence_score(self, path_taken: List[str], risk_assessment: Dict[str, Any]) -> float:
        """Ishonch darajasini hisoblash"""
        base_score = 0.7
        
        # Path uzunligiga qarab
        path_bonus = min(len(path_taken) * 0.05, 0.2)
        
        # Xavf darajasiga qarab
        risk_penalty = 0
        if risk_assessment.get("overall_risk") == "high":
            risk_penalty = 0.2
        elif risk_assessment.get("overall_risk") == "critical":
            risk_penalty = 0.3
        
        final_score = base_score + path_bonus - risk_penalty
        return max(0.0, min(1.0, final_score))
    
    def _create_contract_dispute_template(self) -> Dict[str, Any]:
        """Shartnoma nizolari shabloni"""
        return {
            "type": "contract_dispute",
            "nodes": [
                {
                    "id": "root",
                    "title": "Shartnoma nizoni boshlanishi",
                    "description": "Shartnoma shartlarini tahlil qilish",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "review_contract", "text": "Shartnomani ko'rib chiqish", "next": "contract_review"},
                        {"id": "negotiation", "text": "Muzokaraga tayyorlanish", "next": "negotiation_prep"}
                    ],
                    "risk_level": "low"
                },
                {
                    "id": "contract_review",
                    "title": "Shartnoma tahlili",
                    "description": "Shartnoma shartlarining qonuniyligini tekshirish",
                    "type": "document_filing",
                    "options": [
                        {"id": "legal_check", "text": "Yuridik ekspertiza", "next": "legal_analysis"},
                        {"id": "file_claim", "text": "Da'vo arizasi berish", "next": "court_proceeding"}
                    ],
                    "risk_level": "medium"
                }
            ],
            "edges": [
                {"from": "root", "to": "contract_review", "condition": "review_contract"},
                {"from": "root", "to": "negotiation_prep", "condition": "negotiation"}
            ]
        }
    
    def _create_inheritance_template(self) -> Dict[str, Any]:
        """Vorislik shabloni"""
        return {
            "type": "inheritance_case",
            "nodes": [
                {
                    "id": "root",
                    "title": "Vorislik ishi boshlanishi",
                    "description": "Vorislik tartibini aniqlash",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "verify_documents", "text": "Hujjatlarni tekshirish", "next": "doc_verification"},
                        {"id": "court_proceeding", "text": "Sudga murojaat", "next": "inheritance_court"}
                    ],
                    "risk_level": "medium"
                }
            ],
            "edges": []
        }
    
    def _create_employment_template(self) -> Dict[str, Any]:
        """Mehnat masalalari shabloni"""
        return {
            "type": "employment_issue",
            "nodes": [
                {
                    "id": "root",
                    "title": "Mehnat nizoni",
                    "description": "Ishchi va ish beruvchi o'rtasidagi nizo",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "labor_inspection", "text": "Mehnat inspektsiyasi", "next": "inspection"},
                        {"id": "labor_dispute", "text": "Mehnat komissiyasi", "next": "commission"}
                    ],
                    "risk_level": "low"
                }
            ],
            "edges": []
        }
    
    def _create_family_template(self) -> Dict[str, Any]:
        """Oila masalalari shabloni"""
        return {
            "type": "family_matter",
            "nodes": [
                {
                    "id": "root",
                    "title": "Oila masalasi",
                    "description": "Oilaviy huquqiy masalalar",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "mediation", "text": "Mediasiya", "next": "family_mediation"},
                        {"id": "court", "text": "Sudga murojaat", "next": "family_court"}
                    ],
                    "risk_level": "medium"
                }
            ],
            "edges": []
        }
    
    def _create_criminal_template(self) -> Dict[str, Any]:
        """Jinoyat ishi shabloni"""
        return {
            "type": "criminal_case",
            "nodes": [
                {
                    "id": "root",
                    "title": "Jinoyat ishi",
                    "description": "Jinoyat protsedurasi",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "defense", "text": "Himoya choralari", "next": "criminal_defense"},
                        {"id": "appeal", "text": "Apellyatsiya", "next": "criminal_appeal"}
                    ],
                    "risk_level": "high"
                }
            ],
            "edges": []
        }
    
    def _create_generic_template(self) -> Dict[str, Any]:
        """Umumiy shablon"""
        return {
            "type": "generic",
            "nodes": [
                {
                    "id": "root",
                    "title": "Umumiy qaror",
                    "description": "Standart qaror daraxti",
                    "type": "legal_action",
                    "is_start": True,
                    "options": [
                        {"id": "legal_analysis", "text": "Yuridik tahlil", "next": "analysis"},
                        {"id": "consultation", "text": "Maslahat", "next": "consult"}
                    ],
                    "risk_level": "medium"
                }
            ],
            "edges": []
        }
