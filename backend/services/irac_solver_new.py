"""
IRAC Solver Service
O'zbekiston qonunchiligiga moslashgan IRAC metodologiyasi bo'yicha tahlil
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

class IRACComponent(Enum):
    """IRAC component types"""
    ISSUE = "issue"
    RULE = "rule"
    APPLICATION = "application"
    CONCLUSION = "conclusion"

class DifficultyLevel(Enum):
    """Difficulty levels for IRAC analysis"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CaseType(Enum):
    """Case types for Uzbekistan legal system"""
    CIVIL = "civil"
    CRIMINAL = "criminal"
    FAMILY = "family"
    LABOR = "labor"
    ADMINISTRATIVE = "administrative"

@dataclass
class IRACAnalysisResult:
    """IRAC analysis result structure"""
    id: str
    issue: str
    rule: str
    application: str
    conclusion: str
    confidence_score: float
    legal_references: List[str]
    analysis_notes: str
    difficulty_level: str
    processing_time: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class IRACEvaluationResult:
    """IRAC evaluation result structure"""
    issue_score: float
    rule_score: float
    application_score: float
    conclusion_score: float
    total_score: float
    feedback: str
    suggestions: List[str]
    strengths: List[str]
    weaknesses: List[str]

class IRACSolverService:
    """IRAC Solver Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_codes = {
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_rules": [
                    "Fuqarolik huquqlari va majburiyatlari",
                    "Shartnoma tuzish qoidalari",
                    "Mulkiy mas'uliyat",
                    "Shaxsiy nomoddiy huquqlar",
                    "Vorislik qoidalari"
                ]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_rules": [
                    "Jinoyat tarkibi",
                    "Jazo turlari",
                    "Jinoyat sodir etishda ishtirok",
                    "Javobgarlikdan ozod qilish",
                    "Jinoyat sodir etishdan oldini ol"
                ]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_rules": [
                    "Nikoh va oila",
                    "Oila a'zolarining huquq va majburiyatlari",
                    "Bolalarga nisbatan huquqiy himoya",
                    "Ajralish va nikohni bekor qilish",
                    "Ota-onalik huquqlari"
                ]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_rules": [
                    "Mehnat shartnomasi",
                    "Ish vaqti va dam olish vaqti",
                    "Ish haqi",
                    "Mehnat xavfsizligi",
                    "Mehnat munosabatlarini tugatish"
                ]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_rules": [
                    "Ma'muriy huquqbuzarliklar",
                    "Ma'muriy jazolar",
                    "Ma'muriy jarayon",
                    "Huquqbuzarliklarni ro'yxatga olish",
                    "Javobgarlikdan ozod qilish"
                ]
            }
        }
        
        # IRAC kalit so'zlari
        self.irac_keywords = {
            "issue": [
                "masala", "muammo", "savol", "holat", "vaziyat", "nizolar", 
                "to'qnashuv", "ziddiyat", "bahs", "da'vo", "ariza", "shikoyat"
            ],
            "rule": [
                "qonun", "kodeks", "qoida", "norma", "qaror", "farmoyish", 
                "huquq", "majburiyat", "tartib", "usul", "me'yor", "standart"
            ],
            "application": [
                "qo'llash", "tatbiq etish", "analiz", "baholash", "tahlil",
                "izohlash", "taqqoslash", "moslashtirish", "qo'llanma"
            ],
            "conclusion": [
                "xulosa", "natija", "qaror", "tavsiya", "yakun", "xotima",
                "baholash", "qiyoslash", "tavfsif", "tavsiya"
            ]
        }
    
    async def analyze_case(self, case_text: str, case_type: str, difficulty_level: str, user_id: str) -> Dict[str, Any]:
        """
        Case ni IRAC metodologiyasi bo'yicha tahlil qilish
        
        Args:
            case_text: Tahlil qilinadigan case matni
            case_type: Case turi (civil, criminal, family, labor, administrative)
            difficulty_level: Qiyinlik darajasi (beginner, intermediate, advanced, expert)
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Tahlil natijalari
        """
        start_time = datetime.now()
        
        try:
            # Case matnini tozalash va tayyorlash
            cleaned_text = self._preprocess_text(case_text)
            
            # IRAC komponentlarini ajratib olish
            issue = await self._extract_issue(cleaned_text, case_type)
            rule = await self._extract_rule(cleaned_text, case_type)
            application = await self._extract_application(cleaned_text, case_type, issue, rule)
            conclusion = await self._extract_conclusion(cleaned_text, case_type, issue, rule, application)
            
            # Baholash
            scores = await self._evaluate_irac_components(issue, rule, application, conclusion, difficulty_level)
            
            # AI feedback va tavsiyalar
            feedback_result = await self._generate_ai_feedback(issue, rule, application, conclusion, case_type)
            
            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Natijani tayyorlash
            result = {
                "id": str(uuid.uuid4()),
                "issue": issue,
                "rule": rule,
                "application": application,
                "conclusion": conclusion,
                "scores": scores,
                "total_score": sum(scores.values()) / len(scores),
                "feedback": feedback_result["feedback"],
                "suggestions": feedback_result["suggestions"],
                "legal_references": feedback_result["legal_references"],
                "processing_time": processing_time,
                "status": "completed"
            }
            
            logger.info(f"IRAC analysis completed for user {user_id}, case type: {case_type}")
            return result
            
        except Exception as e:
            logger.error(f"IRAC analysis error: {str(e)}")
            raise Exception(f"IRAC tahlili xatolik: {str(e)}")
    
    def _preprocess_text(self, text: str) -> str:
        """Matnni oldindan ishlash"""
        # Matnni tozalash
        text = re.sub(r'\s+', ' ', text.strip())
        text = re.sub(r'[^\w\s\u0400-\u04FF]', ' ', text)  # Kirill va lotin harflarini saqlash
        
        return text
    
    async def _extract_issue(self, text: str, case_type: str) -> str:
        """Issue (masala) ni ajratib olish"""
        # Issue kalit so'zlari orqali matnni bo'lish
        issue_patterns = [
            r'(?:masala|muammo|savol|holat|vaziyat|nizolar|to\'qnashuv|ziddiyat|bahs|da\'vo|ariza|shikoyat)[\s\.:,]+([^\.!?]*)',
            r'(?i)the\s+(?:issue|problem|question|matter|dispute|conflict)[\s\.:,]+([^\.!?]*)',
            r'(?i)asosiy\s+(?:masala|muammo|savol)[\s\.:,]+([^\.!?]*)'
        ]
        
        for pattern in issue_patterns:
            match = re.search(pattern, text)
            if match:
                issue_text = match.group(1).strip()
                if len(issue_text) > 10:  # Minimal uzunlik tekshiruvi
                    return issue_text
        
        # Agar topilmasa, matnning birinchi qismini issue sifatida qaytarish
        sentences = re.split(r'[.!?]+', text)
        if sentences:
            return sentences[0].strip()
        
        return "Masala aniqlanmadi"
    
    async def _extract_rule(self, text: str, case_type: str) -> str:
        """Rule (qoida) ni ajratib olish"""
        legal_code = self.uzbekistan_legal_codes.get(case_type, {})
        common_rules = legal_code.get("common_rules", [])
        
        # Matnda qonun va qoidalarni qidirish
        rule_patterns = [
            r'(?:qonun|kodeks|qoida|norma|qaror|farmoyish)[\s\.:,]+([^\.!?]*)',
            r'(?i)according\s+to\s+(?:the\s+)?(?:law|code|rule|regulation)[\s\.:,]+([^\.!?]*)',
            r'(?i)(?:based\s+on|pursuant\s+to)[\s\.:,]+([^\.!?]*)'
        ]
        
        found_rules = []
        
        for pattern in rule_patterns:
            matches = re.findall(pattern, text)
            found_rules.extend(matches)
        
        # Agar hech narsa topilmasa, case type ga mos default qoidalarni qaytarish
        if not found_rules and common_rules:
            return f"{legal_code.get('name', 'Qonun hujjatlari')} bo'yicha asosiy qoidalar: {', '.join(common_rules[:3])}"
        
        return " ".join(found_rules) if found_rules else "Qoida aniqlanmadi"
    
    async def _extract_application(self, text: str, case_type: str, issue: str, rule: str) -> str:
        """Application (qo'llash) ni ajratib olish"""
        # Application kalit so'zlari orqali matnni bo'lish
        application_patterns = [
            r'(?:qo\'llash|tatbiq etish|analiz|baholash|tahlil|izohlash)[\s\.:,]+([^\.!?]*)',
            r'(?i)(?:applying|using|applying\s+the)[\s\.:,]+([^\.!?]*)',
            r'(?i)(?:in\s+this\s+case|therefore|thus)[\s\.:,]+([^\.!?]*)'
        ]
        
        for pattern in application_patterns:
            match = re.search(pattern, text)
            if match:
                app_text = match.group(1).strip()
                if len(app_text) > 10:
                    return app_text
        
        # Issue va rule asosida application yaratish
        return f"Berilgan vaziyatda {issue} masalasi {rule} qoidalariga asosan hal qilinmoqda."
    
    async def _extract_conclusion(self, text: str, case_type: str, issue: str, rule: str, application: str) -> str:
        """Conclusion (xulosa) ni ajratib olish"""
        # Conclusion kalit so'zlari orqali matnni bo'lish
        conclusion_patterns = [
            r'(?:xulosa|natija|qaror|tavsiya|yakun|xotima|baholash)[\s\.:,]+([^\.!?]*)',
            r'(?i)(?:conclusion|result|decision|recommendation)[\s\.:,]+([^\.!?]*)',
            r'(?i)(?:therefore|in\s+conclusion|thus)[\s\.:,]+([^\.!?]*)'
        ]
        
        for pattern in conclusion_patterns:
            match = re.search(pattern, text)
            if match:
                conclusion_text = match.group(1).strip()
                if len(conclusion_text) > 10:
                    return conclusion_text
        
        # Issue, rule va application asosida conclusion yaratish
        return f"Xulosa qilib aytish mumkinki, {issue} masalasi bo'yicha {rule} qoidalarini qo'llab, {application} natijasiga ko'ra, tegishli qaror qabul qilinishi kerak."
    
    async def _evaluate_irac_components(self, issue: str, rule: str, application: str, conclusion: str, difficulty_level: str) -> Dict[str, float]:
        """IRAC komponentlarini baholash"""
        base_scores = {
            "beginner": {"min": 60, "max": 80},
            "intermediate": {"min": 50, "max": 85},
            "advanced": {"min": 40, "max": 90},
            "expert": {"min": 30, "max": 95}
        }
        
        score_range = base_scores.get(difficulty_level, {"min": 50, "max": 85})
        
        # Har bir komponentni baholash
        scores = {}
        
        # Issue baholash
        issue_score = self._evaluate_component_text(issue, "issue", score_range)
        scores["issue"] = issue_score
        
        # Rule baholash
        rule_score = self._evaluate_component_text(rule, "rule", score_range)
        scores["rule"] = rule_score
        
        # Application baholash
        app_score = self._evaluate_component_text(application, "application", score_range)
        scores["application"] = app_score
        
        # Conclusion baholash
        conclusion_score = self._evaluate_component_text(conclusion, "conclusion", score_range)
        scores["conclusion"] = conclusion_score
        
        return scores
    
    def _evaluate_component_text(self, text: str, component_type: str, score_range: Dict[str, int]) -> float:
        """Komponent matnini baholash"""
        if not text or len(text) < 10:
            return score_range["min"]
        
        score = score_range["min"]
        
        # Uzunlik bahosi
        if len(text) > 50:
            score += 5
        if len(text) > 100:
            score += 5
        
        # Kalit so'zlarni tekshirish
        keywords = self.irac_keywords.get(component_type, [])
        keyword_count = sum(1 for keyword in keywords if keyword.lower() in text.lower())
        
        if keyword_count > 0:
            score += keyword_count * 2
        
        # Tuzilma bahosi
        if text.count('.') >= 2:  # Kamida 2 ta gap
            score += 5
        
        # Mantiqiy bog'lanish
        logical_connectors = ["chunki", "shuning uchun", "bunda", "agar", "lekin", "va", "ham"]
        connector_count = sum(1 for connector in logical_connectors if connector in text.lower())
        
        if connector_count > 0:
            score += connector_count * 3
        
        return min(score, score_range["max"])
    
    async def _generate_ai_feedback(self, issue: str, rule: str, application: str, conclusion: str, case_type: str) -> Dict[str, Any]:
        """AI feedback va tavsiyalar generatsiyasi"""
        feedback = []
        suggestions = []
        legal_references = []
        
        # Issue feedback
        if len(issue) < 30:
            feedback.append("Issue judqa qisqa, masalani batafsilroq bayon eting.")
            suggestions.append("Masalaning mohiyatini, ishtirokchilarni va vaziyatni to'liqroq tasvirlab bering.")
        else:
            feedback.append("Issue yaxshi shakllantirilgan.")
        
        # Rule feedback
        if "qonun" not in rule.lower() and "kodeks" not in rule.lower():
            feedback.append("Rule qismida aniq qonun havolasi yo'q.")
            suggestions.append("O'zbekiston Respublikasining tegishli kodeks maqolalarini keltiring.")
            legal_code = self.uzbekistan_legal_codes.get(case_type, {})
            legal_references.append(legal_code.get("name", "Qonun hujjati"))
        else:
            feedback.append("Rule to'g'ri shakllantirilgan.")
        
        # Application feedback
        if application.count('.') < 2:
            feedback.append("Application qismi yetarlicha rivojlanmagan.")
            suggestions.append("Qoidani aniq vaziyatga qanday qo'llanilayotganini batafsil bayon eting.")
        else:
            feedback.append("Application yaxshi ishlab chiqilgan.")
        
        # Conclusion feedback
        if "xulosa" not in conclusion.lower() and "natija" not in conclusion.lower():
            feedback.append("Conclusion aniq xulosa bermayapti.")
            suggestions.append("Tahlil natijasini aniq xulosa bilan yakunlang.")
        else:
            feedback.append("Conclusion mantiqiy yakunlangan.")
        
        return {
            "feedback": " | ".join(feedback),
            "suggestions": suggestions,
            "legal_references": legal_references
        }
    
    async def evaluate_irac_analysis(self, analysis_id: str, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """IRAC tahlilini baholash"""
        try:
            # Baholash logikasi
            scores = evaluation_data.get("scores", {})
            
            # Umumiy ball
            total_score = sum(scores.values()) / len(scores) if scores else 0
            
            # Feedback generatsiyasi
            feedback = []
            suggestions = []
            
            if total_score >= 80:
                feedback.append("A'lo baholangan IRAC tahlili!")
                suggestions.append("Bunday yuqori sifatli tahlillar bilan davom eting.")
            elif total_score >= 60:
                feedback.append("Yaxshi IRAC tahlili.")
                suggestions.append("Ba'zi komponentlarni yanada rivojlantirish mumkin.")
            else:
                feedback.append("IRAC tahlilini yaxshilash kerak.")
                suggestions.append("Har bir komponentni batafsilroq bayon eting.")
            
            return {
                "total_score": total_score,
                "feedback": " | ".join(feedback),
                "suggestions": suggestions,
                "strengths": self._identify_strengths(scores),
                "weaknesses": self._identify_weaknesses(scores)
            }
            
        except Exception as e:
            logger.error(f"IRAC evaluation error: {str(e)}")
            raise Exception(f"IRAC baholash xatolik: {str(e)}")
    
    def _identify_strengths(self, scores: Dict[str, float]) -> List[str]:
        """Kuchli tomonlarni aniqlash"""
        strengths = []
        
        for component, score in scores.items():
            if score >= 75:
                strengths.append(f"{component.capitalize()} komponenti yaxshi ishlangan")
        
        return strengths
    
    def _identify_weaknesses(self, scores: Dict[str, float]) -> List[str]:
        """Kuchsiz tomonlarni aniqlash"""
        weaknesses = []
        
        for component, score in scores.items():
            if score < 60:
                weaknesses.append(f"{component.capitalize()} komponentini rivojlantirish kerak")
        
        return weaknesses
