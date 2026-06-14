"""
Weakness Detector Service
O'zbekiston qonunchiligiga moslashgan argumentlardagi zaifliklarni aniqlash
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import re
import json
from dataclasses import dataclass, field
from enum import Enum
import uuid
import random

logger = logging.getLogger(__name__)

class ArgumentType(Enum):
    """Argument turlari"""
    LEGAL = "legal"
    FACTUAL = "factual"
    LOGICAL = "logical"
    EMOTIONAL = "emotional"

class WeaknessType(Enum):
    """Zaiflik turlari"""
    LOGICAL_FALLACY = "logical_fallacy"
    LEGAL_INACCURACY = "legal_inaccuracy"
    FACTUAL_ERROR = "factual_error"
    WEAK_EVIDENCE = "weak_evidence"
    IRRELEVANT_ARGUMENT = "irrelevant_argument"
    EMOTIONAL_APPEAL = "emotional_appeal"
    UNCLEAR_REASONING = "unclear_reasoning"
    CONTRADICTION = "contradiction"
    INSUFFICIENT_SUPPORT = "insufficient_support"
    MISINTERPRETATION = "misinterpretation"

class SeverityLevel(Enum):
    """Javobgarlik darajalari"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class WeaknessPoint:
    """Zaiflik nuqtasi"""
    id: str
    weakness_type: WeaknessType
    description: str
    severity: SeverityLevel
    location: str
    suggestion: str
    legal_references: List[str]

@dataclass
class WeaknessDetectionResult:
    """Zaiflik aniqlash natijasi"""
    id: str
    argument_text: str
    argument_type: str
    overall_score: float
    weakness_points: List[WeaknessPoint]
    strengths: List[str]
    improvement_suggestions: List[str]
    legal_compliance_score: float
    logical_coherence_score: float
    factual_accuracy_score: float
    persuasive_power_score: float
    processing_time: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

class WeaknessDetectorService:
    """Weakness Detector Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_framework = {
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_weaknesses": [
                    "Shartnoma shartlarining noto'g'ri talqini",
                    "Muddatlarning e'tiborsiz qoldirilishi",
                    "Huquqlarning noto'g'ri tushunilishi"
                ]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_weaknesses": [
                    "Jinoyat tarkibining noto'g'ri aniqlanishi",
                    "Dalillarning yetarli emasligi",
                    "Protsedura qoidalarining buzilishi"
                ]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_weaknesses": [
                    "Bolalarning manfaatlarini e'tiborsiz qoldirish",
                    "Aliment majburiyatlarining noto'g'ri hisobi",
                    "Oila mulki taqsimotining xatolari"
                ]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_weaknesses": [
                    "Ish haqi hisobining xatolari",
                    "Ishdan bo'shatish asoslarining zaifligi",
                    "Mehnat shartnomasi shartlarining buzilishi"
                ]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_weaknesses": [
                    "Jarima miqdorining noto'g'ri belgilanishi",
                    "Protsedura qoidalarining buzilishi",
                    "Huquqbuzarlik tarkibining aniqlanmaganligi"
                ]
            }
        }
        
        # Mantiqiy xatolar
        self.logical_fallacies = {
            "ad_hominem": "Shaxsga hujum qilish",
            "straw_man": "Soxta argument",
            "false_dilemma": "Yolg'on tanlov",
            "slippery_slope": "Sirli yo'nalish",
            "circular_reasoning": "Aylanma mantiq",
            "hasty_generalization": "Tez umumlashtirish",
            "appeal_to_authority": "Avtoritetga murojaat",
            "appeal_to_emotion": "His-tuyg'uga murojaat"
        }
        
        # Zaiflik turlari
        self.weakness_patterns = {
            "legal": [
                "qonun hujjatlariga havola yo'q",
                "qonun shartlari noto'g'ri talqin qilingan",
                "huquqiy asoslar zaif",
                "protsedura qoidalariga rioya qilinmagan"
            ],
            "factual": [
                "dalillar yetarli emas",
                "ma'lumotlar xato yoki eskirgan",
                "manbalar ishonchli emas",
                "statistika noto'g'ri ishlatilgan"
            ],
            "logical": [
                "mantiqiy ziddiyat bor",
                "xulosa va premissalar mos kelmaydi",
                "sabab va oqibat bog'lanishi zaif",
                "analogiya noto'g'ri"
            ],
            "emotional": [
                "his-tuyg'uga ortiqcha tayangan",
                    "mantiqiy asoslar yo'q",
                    "manipulyatsiya elementlari bor",
                    "obro'sizlikka urinish"
            ]
        }
    
    async def detect_weaknesses(self, argument_text: str, argument_type: str, context: Optional[str], target_audience: Optional[str], analysis_depth: str, user_id: str) -> Dict[str, Any]:
        """
        Argumentdagi zaifliklarni aniqlash
        
        Args:
            argument_text: Argument matni
            argument_type: Argument turi
            context: Kontekst
            target_audience: Maqsad auditoriya
            analysis_depth: Tahlil chuqurligi
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Aniqlangan zaifliklar
        """
        start_time = datetime.now()
        
        try:
            # Zaifliklarni aniqlash
            weakness_points = self._identify_weaknesses(argument_text, argument_type, analysis_depth)
            
            # Kuchli tomonlarni aniqlash
            strengths = self._identify_strengths(argument_text, argument_type)
            
            # Baholash
            scores = self._calculate_scores(argument_text, argument_type, weakness_points)
            
            # Yaxshilash takliflari
            improvement_suggestions = self._generate_improvement_suggestions(weakness_points, argument_type)
            
            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Natijani tayyorlash
            result = {
                "id": str(uuid.uuid4()),
                "argument_text": argument_text,
                "argument_type": argument_type,
                "overall_score": scores["overall"],
                "weakness_points": [self._weakness_point_to_dict(wp) for wp in weakness_points],
                "strengths": strengths,
                "improvement_suggestions": improvement_suggestions,
                "legal_compliance_score": scores["legal_compliance"],
                "logical_coherence_score": scores["logical_coherence"],
                "factual_accuracy_score": scores["factual_accuracy"],
                "persuasive_power_score": scores["persuasive_power"],
                "processing_time": processing_time,
                "created_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Weakness detection completed for user {user_id}, type: {argument_type}")
            return result
            
        except Exception as e:
            logger.error(f"Weakness detection error: {str(e)}")
            raise Exception(f"Zaifliklarni aniqlash xatolik: {str(e)}")
    
    async def improve_argument(self, original_argument: str, weakness_points: List[str], improvement_style: str, target_length: Optional[str], user_id: str) -> Dict[str, Any]:
        """
        Argumentni yaxshilash takliflari
        
        Args:
            original_argument: Asl argument
            weakness_points: Zaiflik nuqtalari
            improvement_style: Yaxshilash uslubi
            target_length: Maqsad uzunligi
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Yaxshilangan argument
        """
        try:
            # Yaxshilangan argument generatsiyasi
            improved_argument = self._generate_improved_argument(
                original_argument, 
                weakness_points, 
                improvement_style, 
                target_length
            )
            
            # Yaxshilash izohlari
            improvement_explanations = self._generate_improvement_explanations(
                original_argument,
                improved_argument,
                weakness_points
            )
            
            return {
                "original_argument": original_argument,
                "improved_argument": improved_argument,
                "improvement_explanations": improvement_explanations,
                "weakness_points_addressed": weakness_points,
                "improvement_style": improvement_style,
                "target_length": target_length
            }
            
        except Exception as e:
            logger.error(f"Argument improvement error: {str(e)}")
            raise Exception(f"Argument yaxshilash xatolik: {str(e)}")
    
    def get_weakness_types(self) -> List[Dict[str, Any]]:
        """
        Zaiflik turlarini olish
        
        Returns:
            List: Zaiflik turlari ro'yxati
        """
        try:
            weakness_types = []
            
            for weakness_type in WeaknessType:
                weakness_types.append({
                    "id": weakness_type.value,
                    "name": weakness_type.value.replace("_", " ").title(),
                    "description": self._get_weakness_description(weakness_type),
                    "severity_levels": [level.value for level in SeverityLevel]
                })
            
            return weakness_types
            
        except Exception as e:
            logger.error(f"Get weakness types error: {str(e)}")
            raise Exception(f"Zaiflik turlarini olish xatolik: {str(e)}")
    
    def _identify_weaknesses(self, argument_text: str, argument_type: str, analysis_depth: str) -> List[WeaknessPoint]:
        """Zaifliklarni aniqlash"""
        weaknesses = []
        
        # Text ni bo'laklarga ajratish
        sentences = self._split_into_sentences(argument_text)
        
        for i, sentence in enumerate(sentences):
            # Mantiqiy xatolarni tekshirish
            logical_weaknesses = self._check_logical_fallacies(sentence)
            weaknesses.extend(logical_weaknesses)
            
            # Argument turiga qarab tekshirish
            if argument_type in self.weakness_patterns:
                type_weaknesses = self._check_type_specific_weaknesses(sentence, argument_type)
                weaknesses.extend(type_weaknesses)
            
            # Qonunchilik xatolarini tekshirish
            legal_weaknesses = self._check_legal_weaknesses(sentence)
            weaknesses.extend(legal_weaknesses)
            
            # Faktik xatolarni tekshirish
            factual_weaknesses = self._check_factual_weaknesses(sentence)
            weaknesses.extend(factual_weaknesses)
        
        # Analysis depth ga qarab filtrlash
        if analysis_depth == "basic":
            weaknesses = [w for w in weaknesses if w.severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]]
        elif analysis_depth == "comprehensive":
            # Barcha zaifliklarni olish
            pass
        
        return weaknesses
    
    def _identify_strengths(self, argument_text: str, argument_type: str) -> List[str]:
        """Kuchli tomonlarni aniqlash"""
        strengths = []
        
        # Tuzilma tekshiruvi
        if self._has_clear_structure(argument_text):
            strengths.append("Aniq tuzilga")
        
        # Dalillar mavjudligi
        if self._has_evidence(argument_text):
            strengths.append("Dalillar bilan qo'llab-quvvatlangan")
        
        # Qonunchilik havolalari
        if self._has_legal_references(argument_text):
            strengths.append("Qonunchilik hujjatlariga havola")
        
        # Mantiqiy izchillik
        if self._is_logically_coherent(argument_text):
            strengths.append("Mantiqiy izchil")
        
        # Anqlik
        if self._is_clear_and_concise(argument_text):
            strengths.append("Aniq va ixcham ifodalangan")
        
        return strengths
    
    def _calculate_scores(self, argument_text: str, argument_type: str, weakness_points: List[WeaknessPoint]) -> Dict[str, float]:
        """Baholash"""
        base_score = 1.0
        
        # Zaifliklar uchun balllarni ayirish
        for weakness in weakness_points:
            if weakness.severity == SeverityLevel.CRITICAL:
                base_score -= 0.3
            elif weakness.severity == SeverityLevel.HIGH:
                base_score -= 0.2
            elif weakness.severity == SeverityLevel.MEDIUM:
                base_score -= 0.1
            elif weakness.severity == SeverityLevel.LOW:
                base_score -= 0.05
        
        # Xususiy ballar
        legal_compliance = self._calculate_legal_compliance(argument_text, weakness_points)
        logical_coherence = self._calculate_logical_coherence(argument_text, weakness_points)
        factual_accuracy = self._calculate_factual_accuracy(argument_text, weakness_points)
        persuasive_power = self._calculate_persuasive_power(argument_text, weakness_points)
        
        return {
            "overall": max(0.0, base_score),
            "legal_compliance": legal_compliance,
            "logical_coherence": logical_coherence,
            "factual_accuracy": factual_accuracy,
            "persuasive_power": persuasive_power
        }
    
    def _generate_improvement_suggestions(self, weakness_points: List[WeaknessPoint], argument_type: str) -> List[str]:
        """Yaxshilash takliflari"""
        suggestions = []
        
        # Zaiflik turlariga qarab takliflar
        weakness_types = set(wp.weakness_type for wp in weakness_points)
        
        for weakness_type in weakness_types:
            if weakness_type == WeaknessType.LEGAL_INACCURACY:
                suggestions.append("Qonun hujjatlarini to'g'ri talqin qiling va tegishli moddalarga havola bering")
            elif weakness_type == WeaknessType.LOGICAL_FALLACY:
                suggestions.append("Mantiqiy xatolardan qochinib, aniq sabab-oqibat bog'lanishini yarating")
            elif weakness_type == WeaknessType.WEAK_EVIDENCE:
                suggestions.append("Kuchliroq dalillar keltiring va manbalarning ishonchliligini tekshiring")
            elif weakness_type == WeaknessType.EMOTIONAL_APPEAL:
                suggestions.append("His-tuyg'uga emas, balki mantiqiy asoslarga asoslang")
            elif weakness_type == WeaknessType.UNCLEAR_REASONING:
                suggestions.append("Fikringizni aniq va tushunarli ifodalang")
        
        # Umumiy takliflar
        suggestions.extend([
            "Argument tuzilmasini yaxshilang: kirish, asosiy qism, xulosa",
            "Qonunchilik terminlarini to'g'ri ishlating",
            "Qarshi argumentlarni oldindan ko'rib chiqing va ularga javob tayyorlang"
        ])
        
        return suggestions
    
    def _generate_improved_argument(self, original: str, weakness_points: List[str], style: str, target_length: Optional[str]) -> str:
        """Yaxshilangan argument generatsiyasi"""
        # Bu funksiya haqiqiy AI modelini talab qiladi
        # Hozircha mock implementation
        improved = original
        
        # Asosiy yaxshilashlar
        if "legal_inaccuracy" in weakness_points:
            improved += "\n\nQonunchilik nuqtai nazaridan, ushbu holat O'zbekiston Respublikasi Fuqarolik Kodeksining tegishli moddalariga asoslanadi."
        
        if "logical_fallacy" in weakness_points:
            improved += "\n\nMantiqiy jihatdan, quyidagi sabablar bu xulosani qo'llab-quvvatlaydi:"
        
        if "weak_evidence" in weakness_points:
            improved += "\n\nDalillar sifatida quyidagi hujjatlar taqdim etilishi mumkin:"
        
        return improved
    
    def _generate_improvement_explanations(self, original: str, improved: str, weakness_points: List[str]) -> List[str]:
        """Yaxshilash izohlari"""
        explanations = []
        
        for weakness in weakness_points:
            if weakness == "legal_inaccuracy":
                explanations.append("Qonunchilik havolalari qo'shildi va xatolar tuzatildi")
            elif weakness == "logical_fallacy":
                explanations.append("Mantiqiy tuzilma yaxshilandi va xulosalar aniqlashtirildi")
            elif weakness == "weak_evidence":
                explanations.append("Kuchliroq dalillar va manbalar qo'shildi")
        
        return explanations
    
    # Helper methods
    def _split_into_sentences(self, text: str) -> List[str]:
        """Matnni gaplarga bo'lish"""
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _check_logical_fallacies(self, sentence: str) -> List[WeaknessPoint]:
        """Mantiqiy xatolarni tekshirish"""
        weaknesses = []
        
        for fallacy_type, description in self.logical_fallacies.items():
            if self._contains_fallacy_pattern(sentence, fallacy_type):
                weakness = WeaknessPoint(
                    id=str(uuid.uuid4()),
                    weakness_type=WeaknessType.LOGICAL_FALLACY,
                    description=f"Mantiqiy xato: {description}",
                    severity=SeverityLevel.MEDIUM,
                    location=sentence[:50] + "...",
                    suggestion="Bu xatodan qochinib, aniqroq mantiq yuring",
                    legal_references=[]
                )
                weaknesses.append(weakness)
        
        return weaknesses
    
    def _check_type_specific_weaknesses(self, sentence: str, argument_type: str) -> List[WeaknessPoint]:
        """Argument turiga xos zaifliklarni tekshirish"""
        weaknesses = []
        
        patterns = self.weakness_patterns.get(argument_type, [])
        
        for pattern in patterns:
            if pattern.lower() in sentence.lower():
                weakness = WeaknessPoint(
                    id=str(uuid.uuid4()),
                    weakness_type=WeaknessType.INSUFFICIENT_SUPPORT,
                    description=f"Zaiflik: {pattern}",
                    severity=SeverityLevel.MEDIUM,
                    location=sentence[:50] + "...",
                    suggestion="Kuchliroq dalillar keltiring",
                    legal_references=[]
                )
                weaknesses.append(weakness)
        
        return weaknesses
    
    def _check_legal_weaknesses(self, sentence: str) -> List[WeaknessPoint]:
        """Qonunchilik xatolarini tekshirish"""
        weaknesses = []
        
        # Qonun havolalari yo'qligi
        if not re.search(r'\d+-modda|modda \d+', sentence, re.IGNORECASE):
            weakness = WeaknessPoint(
                id=str(uuid.uuid4()),
                weakness_type=WeaknessType.LEGAL_INACCURACY,
                description="Qonun hujjatlariga havola yo'q",
                severity=SeverityLevel.MEDIUM,
                location=sentence[:50] + "...",
                suggestion="Tegishli qonun moddasiga havola qo'shing",
                legal_references=["O'zbekiston Respublikasi Qonunchiligi"]
            )
            weaknesses.append(weakness)
        
        return weaknesses
    
    def _check_factual_weaknesses(self, sentence: str) -> List[WeaknessPoint]:
        """Faktik xatolarni tekshirish"""
        weaknesses = []
        
        # Dalillar yo'qligi
        if not re.search(r'chunki|sababi|asosida|dalil', sentence, re.IGNORECASE):
            weakness = WeaknessPoint(
                id=str(uuid.uuid4()),
                weakness_type=WeaknessType.WEAK_EVIDENCE,
                description="Dalillar yetarli emas",
                severity=SeverityLevel.MEDIUM,
                location=sentence[:50] + "...",
                suggestion="Dalillar va manbalar keltiring",
                legal_references=[]
            )
            weaknesses.append(weakness)
        
        return weaknesses
    
    def _contains_fallacy_pattern(self, sentence: str, fallacy_type: str) -> bool:
        """Xato naqmuning borligini tekshirish"""
        patterns = {
            "ad_hominem": ["shaxs", "kishi", "odam"],
            "straw_man": ["aytishadi", "deydi", "taxmin qiladi"],
            "false_dilemma": ["faqat", "yoki", "boshqa yo'l yo'q"],
            "slippery_slope": ["bunda", "shu sababli", "natijada"],
            "circular_reasoning": ["chunki", "shuning uchun"],
            "hasty_generalization": ["har doim", "hech qachon", "barcha"],
            "appeal_to_authority": ["ekspert", "mutaxassis", "olim"],
            "appeal_to_emotion": ["his", "tuyg'u", "qalb"]
        }
        
        fallacy_patterns = patterns.get(fallacy_type, [])
        return any(pattern in sentence.lower() for pattern in fallacy_patterns)
    
    def _has_clear_structure(self, text: str) -> bool:
        """Aniq tuzilma borligini tekshirish"""
        return len(text.split('.')) >= 3  # Kamida 3 gap
    
    def _has_evidence(self, text: str) -> bool:
        """Dalillar borligini tekshirish"""
        return bool(re.search(r'chunki|sababi|asosida|dalil|manba', text, re.IGNORECASE))
    
    def _has_legal_references(self, text: str) -> bool:
        """Qonunchilik havolalari borligini tekshirish"""
        return bool(re.search(r'\d+-modda|modda \d+|qonun|kodeks', text, re.IGNORECASE))
    
    def _is_logically_coherent(self, text: str) -> bool:
        """Mantiqiy izchillikni tekshirish"""
        # Oddiy tekshirish
        return not re.search(r'lekin|ammo|biroq', text, re.IGNORECASE) or text.count('.') >= 2
    
    def _is_clear_and_concise(self, text: str) -> bool:
        """Anqlik va ixchamlikni tekshirish"""
        return len(text) < 1000 and len(text.split()) > 10
    
    def _calculate_legal_compliance(self, text: str, weaknesses: List[WeaknessPoint]) -> float:
        """Qonunchilik mosligini hisoblash"""
        base_score = 1.0
        legal_weaknesses = [w for w in weaknesses if w.weakness_type == WeaknessType.LEGAL_INACCURACY]
        base_score -= len(legal_weaknesses) * 0.2
        return max(0.0, base_score)
    
    def _calculate_logical_coherence(self, text: str, weaknesses: List[WeaknessPoint]) -> float:
        """Mantiqiy izchillikni hisoblash"""
        base_score = 1.0
        logical_weaknesses = [w for w in weaknesses if w.weakness_type == WeaknessType.LOGICAL_FALLACY]
        base_score -= len(logical_weaknesses) * 0.15
        return max(0.0, base_score)
    
    def _calculate_factual_accuracy(self, text: str, weaknesses: List[WeaknessPoint]) -> float:
        """Faktik aniqlikni hisoblash"""
        base_score = 1.0
        factual_weaknesses = [w for w in weaknesses if w.weakness_type == WeaknessType.FACTUAL_ERROR]
        base_score -= len(factual_weaknesses) * 0.2
        return max(0.0, base_score)
    
    def _calculate_persuasive_power(self, text: str, weaknesses: List[WeaknessPoint]) -> float:
        """Tasir kuchini hisoblash"""
        base_score = 1.0
        emotional_weaknesses = [w for w in weaknesses if w.weakness_type == WeaknessType.EMOTIONAL_APPEAL]
        base_score -= len(emotional_weaknesses) * 0.1
        return max(0.0, base_score)
    
    def _get_weakness_description(self, weakness_type: WeaknessType) -> str:
        """Zaiflik tavsifi"""
        descriptions = {
            WeaknessType.LOGICAL_FALLACY: "Mantiqiy xato yoki noto'g'ri mulohaza",
            WeaknessType.LEGAL_INACCURACY: "Qonunchilik xatosi yoki noto'g'ri talqin",
            WeaknessType.FACTUAL_ERROR: "Faktik xato yoki noto'g'ri ma'lumot",
            WeaknessType.WEAK_EVIDENCE: "Zaif dalillar yoki yetarli bo'lmagan isbot",
            WeaknessType.IRRELEVANT_ARGUMENT: "Mavzuga oid bo'lmagan argument",
            WeaknessType.EMOTIONAL_APPEAL: "His-tuyg'uga asoslangan argument",
            WeaknessType.UNCLEAR_REASONING: "Noma'lum yoki tushunarsiz mulohaza",
            WeaknessType.CONTRADICTION: "Ziddiyat yoki qarama-qarshi fikrlar",
            WeaknessType.INSUFFICIENT_SUPPORT: "Yetarli bo'lmagan qo'llab-quvvatlash",
            WeaknessType.MISINTERPRETATION: "Noto'g'ri talqin yoki tushunmovchilik"
        }
        return descriptions.get(weakness_type, "Noma'lum zaiflik turi")
    
    def _weakness_point_to_dict(self, weakness: WeaknessPoint) -> Dict[str, Any]:
        """WeaknessPoint ni dict ga o'tkazish"""
        return {
            "id": weakness.id,
            "weakness_type": weakness.weakness_type.value,
            "description": weakness.description,
            "severity": weakness.severity.value,
            "location": weakness.location,
            "suggestion": weakness.suggestion,
            "legal_references": weakness.legal_references
        }
