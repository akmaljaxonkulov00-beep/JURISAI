"""
Scenario Generator Service
O'zbekiston qonunchiligiga moslashgan huquqiy senariylar yaratish
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
import random

logger = logging.getLogger(__name__)

class ScenarioType(Enum):
    """Senariyo turlari"""
    CIVIL_DISPUTE = "civil"
    CRIMINAL_CASE = "criminal"
    FAMILY_MATTER = "family"
    LABOR_DISPUTE = "labor"
    ADMINISTRATIVE_CASE = "administrative"

class DifficultyLevel(Enum):
    """Qiyinlik darajalari"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class Complexity(Enum):
    """Murakkablik darajalari"""
    SIMPLE = "simple"
    STANDARD = "standard"
    COMPLEX = "complex"
    EXPERT = "expert"

@dataclass
class ScenarioParticipant:
    """Senariyo ishtirokchisi"""
    id: str
    name: str
    role: str
    description: str
    objectives: List[str]
    background: str
    personality_traits: List[str]

@dataclass
class ScenarioObjective:
    """Senariyo maqsadi"""
    id: str
    description: str
    priority: str
    success_criteria: List[str]
    legal_references: List[str]

@dataclass
class ScenarioResult:
    """Senariyo natijasi"""
    id: str
    scenario_type: str
    title: str
    description: str
    difficulty_level: str
    complexity: str
    participants: List[ScenarioParticipant]
    case_data: Dict[str, Any]
    objectives: List[ScenarioObjective]
    legal_references: List[str]
    estimated_duration: int
    ai_generated: bool
    processing_time: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

class ScenarioGeneratorService:
    """Scenario Generator Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_framework = {
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_disputes": [
                    "Shartnoma buzilishi",
                    "Mulkiy nizolar",
                    "To'lov majburiyatlari",
                    "Vorislik masalalari",
                    "Intellektual mulk"
                ]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_cases": [
                    "O'g'irlik",
                    "Mulkni o'g'irlash",
                    "Jismoniy shikast",
                    "Moliyaviy jinoyatlar",
                    "Korrupsiya"
                ]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_matters": [
                    "Ajralish",
                    "Aliment majburiyatlari",
                    "Bolalarning vasiyligi",
                    "Oila mulki",
                    "Nikohning bekor qilinishi"
                ]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_disputes": [
                    "Ishdan noqonuniy bo'shatish",
                    "Ish haqi to'lanmaganligi",
                    "Mehnat shartnomasi",
                    "Ish xavfsizligi",
                    "Kollektiv kelishmovchilik"
                ]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_cases": [
                    "Yo'l harakati qoidalari",
                    "Soliq to'lamaganlik",
                    "Ijtimoiy tartib",
                    "Ma'muriy protsedura",
                    "Litsenziyasiz faoliyat"
                ]
            }
        }
        
        # Senariyo shablonlari
        self.scenario_templates = {
            "civil": self._create_civil_templates(),
            "criminal": self._create_criminal_templates(),
            "family": self._create_family_templates(),
            "labor": self._create_labor_templates(),
            "administrative": self._create_administrative_templates()
        }
        
        # Ishtirokchi shablonlari
        self.participant_templates = {
            "judge": ["Hakam", "Sudya", "Prokuror", "Advokat"],
            "defendant": ["Ayblanuvchi", "Javobgar", "Muddatli ozodlik"],
            "plaintiff": ["Da'vogar", "Izoh beruvchi", "Shikoyatchi"],
            "witness": ["Guvoh", "Ekspert", "Tarjimon"]
        }
    
    async def generate_scenario(self, scenario_type: str, difficulty_level: str, complexity: str, participants_count: int, focus_areas: List[str], duration_minutes: int, user_id: str) -> Dict[str, Any]:
        """
        Huquqiy senariyo yaratish
        
        Args:
            scenario_type: Senariyo turi
            difficulty_level: Qiyinlik darajasi
            complexity: Murakkablik darajasi
            participants_count: Ishtirokchilar soni
            focus_areas: Diqqat markazlari
            duration_minutes: Davomiyligi
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Yaratilgan senariyo
        """
        start_time = datetime.now()
        
        try:
            # Senariyo shablonini tanlash
            template = self._select_scenario_template(scenario_type, difficulty_level, complexity)
            
            # Ishtirokchilarni yaratish
            participants = self._generate_participants(participants_count, scenario_type, difficulty_level)
            
            # Case ma'lumotlarini yaratish
            case_data = self._generate_case_data(template, scenario_type, difficulty_level, focus_areas)
            
            # Maqsadlarni yaratish
            objectives = self._generate_objectives(scenario_type, difficulty_level, case_data)
            
            # Huquqiy havolalarni yaratish
            legal_references = self._generate_legal_references(scenario_type, case_data)
            
            # Sarlavha va tavsif
            title = self._generate_title(scenario_type, case_data)
            description = self._generate_description(case_data, participants)
            
            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Natijani tayyorlash
            result = {
                "id": str(uuid.uuid4()),
                "scenario_type": scenario_type,
                "title": title,
                "description": description,
                "difficulty_level": difficulty_level,
                "complexity": complexity,
                "participants": [self._participant_to_dict(p) for p in participants],
                "case_data": case_data,
                "objectives": [self._objective_to_dict(o) for o in objectives],
                "legal_references": legal_references,
                "estimated_duration": duration_minutes,
                "ai_generated": True,
                "processing_time": processing_time,
                "created_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Scenario generated for user {user_id}, type: {scenario_type}")
            return result
            
        except Exception as e:
            logger.error(f"Scenario generation error: {str(e)}")
            raise Exception(f"Senariyo yaratish xatolik: {str(e)}")
    
    async def evaluate_scenario(self, scenario_id: str, user_performance: Dict[str, Any], completion_time: int, decisions_made: List[str]) -> Dict[str, Any]:
        """
        Senariyoni baholash
        
        Args:
            scenario_id: Senariyo ID
            user_performance: Foydalanuvchi ko'rsatkichlari
            completion_time: Tugash vaqti
            decisions_made: Qabul qilingan qarorlar
            
        Returns:
            Dict: Baholash natijalari
        """
        try:
            # Performance score hisobi
            performance_score = self._calculate_performance_score(user_performance, completion_time, decisions_made)
            
            # Feedback generatsiyasi
            feedback = self._generate_feedback(performance_score, decisions_made)
            
            # Tavsiyalar
            recommendations = self._generate_recommendations(performance_score, user_performance)
            
            return {
                "performance_score": performance_score,
                "feedback": feedback,
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Scenario evaluation error: {str(e)}")
            raise Exception(f"Senariyoni baholash xatolik: {str(e)}")
    
    async def get_scenario_templates(self) -> List[Dict[str, Any]]:
        """
        Senariyo shablonlarini olish
        
        Returns:
            List: Shablonlar ro'yxati
        """
        try:
            templates = []
            
            for scenario_type, type_templates in self.scenario_templates.items():
                for template in type_templates:
                    templates.append({
                        "id": template["id"],
                        "scenario_type": scenario_type,
                        "title": template["title"],
                        "description": template["description"],
                        "difficulty_level": template["difficulty_level"],
                        "complexity": template["complexity"],
                        "estimated_duration": template["estimated_duration"],
                        "participants_count": template["participants_count"]
                    })
            
            return templates
            
        except Exception as e:
            logger.error(f"Get templates error: {str(e)}")
            raise Exception(f"Shablonlarni olish xatolik: {str(e)}")
    
    def _select_scenario_template(self, scenario_type: str, difficulty_level: str, complexity: str) -> Dict[str, Any]:
        """Senariyo shablonini tanlash"""
        templates = self.scenario_templates.get(scenario_type, [])
        
        # Filter by difficulty and complexity
        filtered_templates = [
            t for t in templates 
            if t["difficulty_level"] == difficulty_level and t["complexity"] == complexity
        ]
        
        if not filtered_templates:
            filtered_templates = templates  # Fallback to any template
        
        return random.choice(filtered_templates) if filtered_templates else templates[0]
    
    def _generate_participants(self, count: int, scenario_type: str, difficulty: str) -> List[ScenarioParticipant]:
        """Ishtirokchilarni yaratish"""
        participants = []
        
        # Asosiy rollarni aniqlash
        roles = self._get_scenario_roles(scenario_type, count)
        
        for i, role in enumerate(roles):
            participant = ScenarioParticipant(
                id=str(uuid.uuid4()),
                name=self._generate_name(role, i),
                role=role,
                description=self._generate_participant_description(role, scenario_type),
                objectives=self._generate_participant_objectives(role, scenario_type),
                background=self._generate_participant_background(role, difficulty),
                personality_traits=self._generate_personality_traits(role, difficulty)
            )
            participants.append(participant)
        
        return participants
    
    def _generate_case_data(self, template: Dict[str, Any], scenario_type: str, difficulty: str, focus_areas: List[str]) -> Dict[str, Any]:
        """Case ma'lumotlarini yaratish"""
        base_data = template["case_data"].copy()
        
        # Difficulty ga qarab ma'lumotlarni murakkablashtirish
        if difficulty == "advanced" or difficulty == "expert":
            base_data["additional_facts"] = self._generate_additional_facts(scenario_type, difficulty)
            base_data["complications"] = self._generate_complications(scenario_type, difficulty)
        
        # Focus areas ni qo'llash
        if focus_areas:
            base_data["focus_areas"] = focus_areas
        
        return base_data
    
    def _generate_objectives(self, scenario_type: str, difficulty: str, case_data: Dict[str, Any]) -> List[ScenarioObjective]:
        """Maqsadlarni yaratish"""
        objectives = []
        
        # Asosiy maqsadlar
        main_objectives = self._get_main_objectives(scenario_type)
        
        for i, obj_desc in enumerate(main_objectives):
            objective = ScenarioObjective(
                id=str(uuid.uuid4()),
                description=obj_desc,
                priority="high" if i == 0 else "medium",
                success_criteria=self._generate_success_criteria(scenario_type, obj_desc),
                legal_references=self._generate_objective_legal_references(scenario_type)
            )
            objectives.append(objective)
        
        return objectives
    
    def _generate_legal_references(self, scenario_type: str, case_data: Dict[str, Any]) -> List[str]:
        """Huquqiy havolalarni yaratish"""
        framework = self.uzbekistan_legal_framework.get(scenario_type, {})
        references = []
        
        # Asosiy kodeks
        references.append(framework.get("name", "Qonun hujjati"))
        
        # Maqolalar
        key_articles = framework.get("key_articles", [])
        if key_articles:
            selected_articles = random.sample(key_articles, min(3, len(key_articles)))
            for article in selected_articles:
                references.append(f"{framework.get('name', 'Kodeks')} {article}-modda")
        
        return references
    
    def _generate_title(self, scenario_type: str, case_data: Dict[str, Any]) -> str:
        """Sarlavha generatsiyasi"""
        titles = {
            "civil": [
                "Shartnoma nizosi: {subject}",
                "Mulkiy bahs: {subject}",
                "To'lov majburiyati: {subject}"
            ],
            "criminal": [
                "Jinoyat ishi: {subject}",
                "Tergov ishi: {subject}",
                "Sud protsessi: {subject}"
            ],
            "family": [
                "Oila masalasi: {subject}",
                "Ajralish ishi: {subject}",
                "Vorislik masalasi: {subject}"
            ],
            "labor": [
                "Mehnat nizosi: {subject}",
                "Ishdan bo'shatish: {subject}",
                "Ish haqi masalasi: {subject}"
            ],
            "administrative": [
                "Ma'muriy ish: {subject}",
                "Huquqbuzarlik: {subject}",
                "Jarima: {subject}"
            ]
        }
        
        scenario_titles = titles.get(scenario_type, ["Senariyo: {subject}"])
        template = random.choice(scenario_titles)
        
        subject = case_data.get("subject", "Noma'lum mavzu")
        return template.format(subject=subject)
    
    def _generate_description(self, case_data: Dict[str, Any], participants: List[ScenarioParticipant]) -> str:
        """Tavsif generatsiyasi"""
        description = f"Ushbu senariyoda {len(participants)} nafar ishtirokchi ishtirok etadi. "
        
        if case_data.get("subject"):
            description += f"Asosiy mavzu: {case_data['subject']}. "
        
        if case_data.get("background"):
            description += f"Tarix: {case_data['background']}. "
        
        if case_data.get("key_issue"):
            description += f"Asosiy muammo: {case_data['key_issue']}. "
        
        return description
    
    def _calculate_performance_score(self, performance: Dict[str, Any], completion_time: int, decisions: List[str]) -> float:
        """Performance score hisobi"""
        base_score = 0.7
        
        # Vaqt faktori
        if completion_time < 1800:  # 30 daqiqa
            base_score += 0.1
        elif completion_time > 3600:  # 1 soat
            base_score -= 0.1
        
        # Qarorlar soni
        decision_bonus = min(len(decisions) * 0.05, 0.2)
        base_score += decision_bonus
        
        # Performance metrics
        if performance.get("accuracy", 0) > 0.8:
            base_score += 0.1
        
        return max(0.0, min(1.0, base_score))
    
    def _generate_feedback(self, score: float, decisions: List[str]) -> str:
        """Feedback generatsiyasi"""
        if score >= 0.8:
            return "A'lo! Senariyoni muvaffaqiyatli yakunladingiz. Qarorlaringiz to'g'ri va o'ylangan."
        elif score >= 0.6:
            return "Yaxshi. Senariyoni muvaffaqiyatli yakunladingiz, lekin ba'zi jihatlarni yaxshilash mumkin."
        else:
            return "Qoniqarli. Senariyoni yakunladingiz, lekin keyingi safar ko'proq tayyorgarlik ko'ring."
    
    def _generate_recommendations(self, score: float, performance: Dict[str, Any]) -> List[str]:
        """Tavsiyalar generatsiyasi"""
        recommendations = []
        
        if score < 0.7:
            recommendations.append("Qonun hujjatlarini chuqurroq o'rganing")
            recommendations.append("Mantiqiy fikr yuritishni rivojlantiring")
        
        if performance.get("time_management", 0) < 0.6:
            recommendations.append("Vaqtni boshqarish ko'nikmalarini yaxshilang")
        
        recommendations.append("Amaliy tajribangizni oshiring")
        
        return recommendations
    
    # Helper methods
    def _get_scenario_roles(self, scenario_type: str, count: int) -> List[str]:
        """Senariyo rollarini olish"""
        all_roles = ["judge", "defendant", "plaintiff", "witness", "expert", "prosecutor", "lawyer"]
        return all_roles[:count]
    
    def _generate_name(self, role: str, index: int) -> str:
        """Ism generatsiyasi"""
        names = {
            "judge": ["Hakam Aliyev", "Sudya Karimov"],
            "defendant": ["Ahmedov Bobur", "Toshmatova Dilnoza"],
            "plaintiff": ["Saidova Gulnora", "Rahimov Jasur"],
            "witness": ["G'ulomov Aziz", "Nazarova Zuhra"],
            "expert": ["Dr. Umarov", "Prof. Ahmedova"]
        }
        role_names = names.get(role, ["Foydalanuvchi"])
        return role_names[index % len(role_names)]
    
    def _generate_participant_description(self, role: str, scenario_type: str) -> str:
        """Ishtirokchi tavsifi"""
        descriptions = {
            "judge": "Sud protsessini boshqaruvchi hakam",
            "defendant": "Ayblanuvchi tomon vakili",
            "plaintiff": "Da'vogar tomon vakili",
            "witness": "Voqea guvohi",
            "expert": "Ekspert baholovchisi"
        }
        return descriptions.get(role, "Ishtirokchi")
    
    def _generate_participant_objectives(self, role: str, scenario_type: str) -> List[str]:
        """Ishtirokchi maqsadlari"""
        objectives = {
            "judge": ["Adolatli qaror qabul qilish", "Protsedurani saqlash"],
            "defendant": ["Aybini isbotlash", "Eng yengil jazoga erishish"],
            "plaintiff": ["Da'vosini isbotlash", "To'liq kompensatsiya olish"],
            "witness": ["Haqiqatni aytish", "Adolatli guvohlik berish"],
            "expert": ["Ekspert bahosi berish", "Xulosa chiqarish"]
        }
        return objectives.get(role, ["Maqsadni aniqlash"])
    
    def _generate_participant_background(self, role: str, difficulty: str) -> str:
        """Ishtirokchi tarixi"""
        backgrounds = {
            "judge": "10 yillik sud tajribasi",
            "defendant": "Oldin jinoiyati yo'q",
            "plaintiff": "Biznesmen",
            "witness": "Voqea joyida bo'lgan",
            "expert": "15 yillik tajriba"
        }
        return backgrounds.get(role, "Tarixi noma'lum")
    
    def _generate_personality_traits(self, role: str, difficulty: str) -> List[str]:
        """Shaxsiy xususiyatlar"""
        traits = {
            "judge": ["adolatli", "qattiqqo'l", "tahlilchi"],
            "defendant": ["aqli", "ehtiyotkor", "gapirguvchan"],
            "plaintiff": ["qat'iy", "talabkor", "mantiqiy"],
            "witness": ["vijdonli", "aniq", "sodiq"],
            "expert": ["professional", "diqqatli", "obro'li"]
        }
        return traits.get(role, ["xotirjam", "halol"])
    
    def _generate_additional_facts(self, scenario_type: str, difficulty: str) -> List[str]:
        """Qo'shimcha faktlar"""
        return [
            "Oldingi o'xshash ishlar mavjud",
            "Qo'shimcha guvohlar topilgan",
            "Yangi dalillar paydo bo'lgan"
        ]
    
    def _generate_complications(self, scenario_type: str, difficulty: str) -> List[str]:
        """Murakkabliklar"""
        return [
            "Dalillar yetarli emas",
            "Guvohlar ziddiyatli",
            "Hujjatlar yo'qolgan"
        ]
    
    def _get_main_objectives(self, scenario_type: str) -> List[str]:
        """Asosiy maqsadlar"""
        objectives = {
            "civil": ["Shartnoma shartlarini aniqlash", "To'lovni ta'minlash"],
            "criminal": ["Aybni isbotlash", "Jazoni aniqlash"],
            "family": ["Bolalarning manfaatini himoya qilish", "Adolatli taqsimot"],
            "labor": ["Ishchi huquqlarini himoya qilish", "To'lovni tiklash"],
            "administrative": ["Huquqbuzarlikni aniqlash", "Jarima belgilash"]
        }
        return objectives.get(scenario_type, ["Maqsadni aniqlash"])
    
    def _generate_success_criteria(self, scenario_type: str, objective: str) -> List[str]:
        """Muvaffaqiyat mezonlari"""
        return [
            "Qonun hujjatlariga asoslangan qaror",
            "Ikkala tomon uchun adolatli yechim",
            "Protsedura qoidalari rioya qilingan"
        ]
    
    def _generate_objective_legal_references(self, scenario_type: str) -> List[str]:
        """Maqsad huquqiy havolalari"""
        framework = self.uzbekistan_legal_framework.get(scenario_type, {})
        return [framework.get("name", "Qonun hujjati")]
    
    def _participant_to_dict(self, participant: ScenarioParticipant) -> Dict[str, Any]:
        """Ishtirokchini dict ga o'tkazish"""
        return {
            "id": participant.id,
            "name": participant.name,
            "role": participant.role,
            "description": participant.description,
            "objectives": participant.objectives,
            "background": participant.background,
            "personality_traits": participant.personality_traits
        }
    
    def _objective_to_dict(self, objective: ScenarioObjective) -> Dict[str, Any]:
        """Maqsadni dict ga o'tkazish"""
        return {
            "id": objective.id,
            "description": objective.description,
            "priority": objective.priority,
            "success_criteria": objective.success_criteria,
            "legal_references": objective.legal_references
        }
    
    def _create_civil_templates(self) -> List[Dict[str, Any]]:
        """Fuqarolik senariyo shablonlari"""
        return [
            {
                "id": "civil_contract_dispute",
                "title": "Shartnoma nizosi",
                "description": "Shartnoma shartlarining buzilishi",
                "difficulty_level": "intermediate",
                "complexity": "standard",
                "participants_count": 3,
                "estimated_duration": 45,
                "case_data": {
                    "subject": "Mebel sotib olish shartnomasi",
                    "background": "Sotuvchi vaxtida mebelni yetkazmagan",
                    "key_issue": "Shartnoma shartlarining buzilishi"
                }
            }
        ]
    
    def _create_criminal_templates(self) -> List[Dict[str, Any]]:
        """Jinoyat senariyo shablonlari"""
        return [
            {
                "id": "criminal_theft",
                "title": "O'g'irlik ishi",
                "description": "Mulkni o'g'irlash holati",
                "difficulty_level": "intermediate",
                "complexity": "standard",
                "participants_count": 4,
                "estimated_duration": 60,
                "case_data": {
                    "subject": "Do'kondan o'g'irlik",
                    "background": "Tunda do'kon buzilgan",
                    "key_issue": "O'g'irlik faktining isboti"
                }
            }
        ]
    
    def _create_family_templates(self) -> List[Dict[str, Any]]:
        """Oila senariyo shablonlari"""
        return [
            {
                "id": "family_divorce",
                "title": "Ajralish ishi",
                "description": "Nikohni bekor qilish",
                "difficulty_level": "intermediate",
                "complexity": "standard",
                "participants_count": 3,
                "estimated_duration": 50,
                "case_data": {
                    "subject": "Ajralish va bolalar vasiyligi",
                    "background": "5 yil nikohda 2 farzand bor",
                    "key_issue": "Bolalarning qaysi tarafda qolishi"
                }
            }
        ]
    
    def _create_labor_templates(self) -> List[Dict[str, Any]]:
        """Mehnat senariyo shablonlari"""
        return [
            {
                "id": "labor_dismissal",
                "title": "Ishdan bo'shatish",
                "description": "Noqonuniy ishdan bo'shatish",
                "difficulty_level": "intermediate",
                "complexity": "standard",
                "participants_count": 3,
                "estimated_duration": 40,
                "case_data": {
                    "subject": "Ishdan noqonuniy bo'shatish",
                    "background": "Ishchi 3 yil ishlagan, to'lovlar qilingan",
                    "key_issue": "Bo'shatishning asoslari"
                }
            }
        ]
    
    def _create_administrative_templates(self) -> List[Dict[str, Any]]:
        """Ma'muriy senariyo shablonlari"""
        return [
            {
                "id": "administrative_traffic",
                "title": "Yo'l harakati qoidalari",
                "description": "Tezlikni oshirib ketish",
                "difficulty_level": "beginner",
                "complexity": "simple",
                "participants_count": 2,
                "estimated_duration": 30,
                "case_data": {
                    "subject": "Tezlikni oshirish",
                    "background": "Shahar ichida 100 km/soat tezlik",
                    "key_issue": "Jarima miqdori"
                }
            }
        ]
