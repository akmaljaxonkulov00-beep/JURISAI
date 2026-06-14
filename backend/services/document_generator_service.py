"""
Document Generator Service
O'zbekiston qonunchiligiga moslashgan huquqiy hujjatlar yaratish
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

class DocumentType(Enum):
    """Hujjat turlari"""
    CONTRACT = "contract"
    CLAIM = "claim"
    AGREEMENT = "agreement"
    POWER_OF_ATTORNEY = "power_of_attorney"
    COMPLAINT = "complaint"
    PETITION = "petition"
    APPLICATION = "application"
    CERTIFICATE = "certificate"
    DECLARATION = "declaration"
    PROTOCOL = "protocol"

class OutputFormat(Enum):
    """Chiqarish formatlari"""
    PDF = "pdf"
    DOCX = "docx"
    HTML = "html"
    TXT = "txt"

class Language(Enum):
    """Tillar"""
    UZBEK = "uz"
    RUSSIAN = "ru"
    ENGLISH = "en"

@dataclass
class DocumentField:
    """Hujjat maydoni"""
    id: str
    name: str
    type: str  # text, number, date, select, textarea
    required: bool
    default_value: Optional[str] = None
    options: Optional[List[str]] = None
    validation: Optional[Dict[str, Any]] = None
    placeholder: Optional[str] = None

@dataclass
class DocumentTemplate:
    """Hujjat shabloni"""
    id: str
    name: str
    description: str
    category: str
    document_type: DocumentType
    fields: List[DocumentField]
    content_template: str
    legal_references: List[str]
    preview_text: str
    language: Language

@dataclass
class GeneratedDocument:
    """Yaratilgan hujjat"""
    id: str
    template_id: str
    template_name: str
    document_type: str
    content: str
    file_url: Optional[str]
    metadata: Dict[str, Any]
    status: str
    created_at: datetime = field(default_factory=datetime.utcnow)

class DocumentGeneratorService:
    """Document Generator Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_framework = {
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_documents": [
                    "Shartnoma",
                    "Da'vo arizasi",
                    "Vakolatnoma",
                    "Kelishuv",
                    "Ariza"
                ]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_documents": [
                    "Shikoyat arizasi",
                    "Apellyatsiya shikoyati",
                    "Vakolatnoma",
                    "Bayonot"
                ]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_documents": [
                    "Ajralish to'g'risida ariza",
                    "Aliment to'g'risida ariza",
                    "Vorislik to'g'risida ariza",
                    "Nikoh shartnomasi"
                ]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_documents": [
                    "Mehnat shartnomasi",
                    "Ishdan bo'shatish to'g'risida ariza",
                    "Ish haqi da'vosi",
                    "Kollektiv shartnoma"
                ]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
                "common_documents": [
                    "Ariza",
                    "Shikoyat",
                    "Bayonot",
                    "Dalolatnoma"
                ]
            }
        }
        
        # Hujjat shablonlari
        self.document_templates = self._create_document_templates()
        
        # Kategoriyalar
        self.categories = [
            "civil",
            "criminal", 
            "family",
            "labor",
            "administrative",
            "commercial",
            "property",
            "inheritance"
        ]
    
    async def generate_document(self, template_id: str, document_data: Dict[str, Any], output_format: str, language: str, custom_fields: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Huquqiy hujjat yaratish
        
        Args:
            template_id: Shablon ID
            document_data: Hujjat ma'lumotlari
            output_format: Chiqarish formati
            language: Til
            custom_fields: Qo'shimcha maydonlar
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Yaratilgan hujjat
        """
        try:
            # Shablonni olish
            template = await self._get_template_by_id(template_id)
            if not template:
                raise Exception("Shablon topilmadi")
            
            # Ma'lumotlarni tekshirish
            validated_data = self._validate_document_data(template, document_data)
            
            # Hujjat mazmunini yaratish
            content = self._generate_document_content(template, validated_data, custom_fields)
            
            # Faylni yaratish (mock)
            file_url = await self._create_file(content, output_format)
            
            # Metadatani yaratish
            metadata = {
                "template_id": template_id,
                "template_name": template.name,
                "document_type": template.document_type.value,
                "category": template.category,
                "language": language,
                "output_format": output_format,
                "fields_count": len(template.fields),
                "legal_references": template.legal_references,
                "generated_by": user_id
            }
            
            # Natijani tayyorlash
            result = {
                "id": str(uuid.uuid4()),
                "template_name": template.name,
                "document_type": template.document_type.value,
                "content": content,
                "file_url": file_url,
                "metadata": metadata,
                "status": "completed",
                "created_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Document generated for user {user_id}, template: {template.name}")
            return result
            
        except Exception as e:
            logger.error(f"Document generation error: {str(e)}")
            raise Exception(f"Hujjat yaratish xatolik: {str(e)}")
    
    async def get_document_templates(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Hujjat shablonlarini olish
        
        Args:
            category: Kategoriya (ixtiyoriy)
            
        Returns:
            List: Shablonlar ro'yxati
        """
        try:
            templates = []
            
            for template in self.document_templates:
                if category and template.category != category:
                    continue
                
                templates.append({
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "document_type": template.document_type.value,
                    "fields": [self._field_to_dict(field) for field in template.fields],
                    "legal_references": template.legal_references,
                    "preview_text": template.preview_text,
                    "language": template.language.value
                })
            
            return templates
            
        except Exception as e:
            logger.error(f"Get templates error: {str(e)}")
            raise Exception(f"Shablonlarni olish xatolik: {str(e)}")
    
    async def get_document_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Ma'lum bir shablonni olish
        
        Args:
            template_id: Shablon ID
            
        Returns:
            Dict: Shablon ma'lumotlari
        """
        try:
            template = await self._get_template_by_id(template_id)
            if not template:
                return None
            
            return {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "category": template.category,
                "document_type": template.document_type.value,
                "fields": [self._field_to_dict(field) for field in template.fields],
                "content_template": template.content_template,
                "legal_references": template.legal_references,
                "preview_text": template.preview_text,
                "language": template.language.value
            }
            
        except Exception as e:
            logger.error(f"Get template error: {str(e)}")
            raise Exception(f"Shablonni olish xatolik: {str(e)}")
    
    async def preview_template(self, template_id: str, document_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Shablonni oldindan ko'rish
        
        Args:
            template_id: Shablon ID
            document_data: Hujjat ma'lumotlari
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Oldindan ko'rish natijasi
        """
        try:
            template = await self._get_template_by_id(template_id)
            if not template:
                raise Exception("Shablon topilmadi")
            
            # Ma'lumotlarni tekshirish
            validated_data = self._validate_document_data(template, document_data)
            
            # Hujjat mazmunini yaratish
            content = self._generate_document_content(template, validated_data, {})
            
            return {
                "template_id": template_id,
                "template_name": template.name,
                "preview_content": content,
                "fields_filled": len(validated_data),
                "total_fields": len(template.fields)
            }
            
        except Exception as e:
            logger.error(f"Preview template error: {str(e)}")
            raise Exception(f"Oldindan ko'rish xatolik: {str(e)}")
    
    async def get_document_categories(self) -> List[Dict[str, Any]]:
        """
        Hujjat kategoriyalarini olish
        
        Returns:
            List: Kategoriyalar ro'yxati
        """
        try:
            categories = []
            
            for category in self.categories:
                # Har bir kategoriya uchun shablonlar sonini hisoblash
                template_count = len([t for t in self.document_templates if t.category == category])
                
                categories.append({
                    "id": category,
                    "name": self._get_category_name(category),
                    "description": self._get_category_description(category),
                    "template_count": template_count
                })
            
            return categories
            
        except Exception as e:
            logger.error(f"Get categories error: {str(e)}")
            raise Exception(f"Kategoriyalarni olish xatolik: {str(e)}")
    
    def _create_document_templates(self) -> List[DocumentTemplate]:
        """Hujjat shablonlarini yaratish"""
        templates = []
        
        # Fuqarolik shablonlari
        templates.extend([
            DocumentTemplate(
                id="contract_basic",
                name="Oddiy shartnoma",
                description="Standart shartnoma shabloni",
                category="civil",
                document_type=DocumentType.CONTRACT,
                fields=[
                    DocumentField("party1_name", "1-tomon nomi", "text", True),
                    DocumentField("party2_name", "2-tomon nomi", "text", True),
                    DocumentField("subject", "Shartnoma predmeti", "textarea", True),
                    DocumentField("amount", "Summa", "number", False),
                    DocumentField("currency", "Valyuta", "select", False, options=["UZS", "USD", "EUR"]),
                    DocumentField("duration", "Muddat", "text", False),
                    DocumentField("start_date", "Boshlanish sanasi", "date", True),
                    DocumentField("end_date", "Tugash sanasi", "date", False)
                ],
                content_template="""
SHARTNOMA

{start_date} sanasida {party1_name} (1-tomon) bilan {party2_name} (2-tomon) o'rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
{subject}

2. SHARTNOMA MIQDORI
Summa: {amount} {currency}

3. SHARTNOMA MUDDATI
{duration}

4. QONUNIY ASOSLAR
Ushbu shartnoma O'zbekiston Respublikasi Fuqarolik Kodeksining 357-382-moddalariga asoslanadi.

5. QO'SHIMCHA SHARTLAR
{additional_terms}

6. MANZIL
Toshkent shahri

7. IMZOLAR
1-tomon: ____________________ {party1_name}
2-tomon: ____________________ {party2_name}
""",
                legal_references=["O'zbekiston Respublikasi Fuqarolik Kodeksi 357-382-moddalar"],
                preview_text="Standart shartnoma ikki tomon o'rtasida...",
                language=Language.UZBEK
            ),
            
            DocumentTemplate(
                id="claim_civil",
                name="Fuqarolik da'vosi",
                description="Fuqarolik ishi bo'yicha da'vo arizasi",
                category="civil",
                document_type=DocumentType.CLAIM,
                fields=[
                    DocumentField("court_name", "Sud nomi", "text", True),
                    DocumentField("plaintiff_name", "Da'vogar nomi", "text", True),
                    DocumentField("plaintiff_address", "Da'vogar manzili", "text", True),
                    DocumentField("defendant_name", "Javobgar nomi", "text", True),
                    DocumentField("defendant_address", "Javobgar manzili", "text", True),
                    DocumentField("claim_amount", "Da'vo miqdori", "number", False),
                    DocumentField("claim_reason", "Da'vo sababi", "textarea", True),
                    DocumentField("evidence", "Dalillar", "textarea", False)
                ],
                content_template="""
DA'VO ARIZASI

{court_name}ga

Da'vogar: {plaintiff_name}
Manzili: {plaintiff_address}

Javobgar: {defendant_name}
Manzili: {defendant_address}

DA'VO TALABI
{claim_amount} so'm miqdoridagi pul mablag'ini undirish to'g'risida

DA'VO SABLARI
{claim_reason}

DALILLAR
{evidence}

QONUNIY ASOSLAR
O'zbekiston Respublikasi Fuqarolik Kodeksining tegishli moddalariga asosan...

SANA: {current_date}
IMZO: ____________________ {plaintiff_name}
""",
                legal_references=["O'zbekiston Respublikasi Fuqarolik Kodeksi", "O'zbekiston Respublikasi Fuqarolik protsessual kodeksi"],
                preview_text="Fuqarolik ishi bo'yicha pul mablag'ini undirish...",
                language=Language.UZBEK
            )
        ])
        
        # Mehnat shablonlari
        templates.extend([
            DocumentTemplate(
                id="labor_contract",
                name="Mehnat shartnomasi",
                description="Ishchi va ish beruvchi o'rtasidagi mehnat shartnomasi",
                category="labor",
                document_type=DocumentType.CONTRACT,
                fields=[
                    DocumentField("employer_name", "Ish beruvchi nomi", "text", True),
                    DocumentField("employee_name", "Ishchi nomi", "text", True),
                    DocumentField("position", "Lavozim", "text", True),
                    DocumentField("salary", "Ish haqi", "number", True),
                    DocumentField("currency", "Valyuta", "select", False, options=["UZS", "USD"]),
                    DocumentField("work_schedule", "Ish grafigi", "text", False),
                    DocumentField("start_date", "Ishga kirish sanasi", "date", True),
                    DocumentField("probation_period", "Sinov muddati", "text", False)
                ],
                content_template="""
MEHNAT SHARTNOMASI

{start_date} sanasida {employer_name} (ish beruvchi) bilan {employee_name} (ishchi) o'rtasida quyidagi mehnat shartnomasi tuzildi:

1. ISHCHI VA ISH BERUVCHI HAQIDA
Ish beruvchi: {employer_name}
Ishchi: {employee_name}

2. LAVOZIM
{position}

3. ISH HAQI
{salary} {currency} miqdorida

4. ISH GRAFIGI
{work_schedule}

5. ISHGA KIRISH SANASI
{start_date}

6. SINOV MUDDATI
{probation_period}

7. QONUNIY ASOSLAR
O'zbekiston Respublikasi Mehnat Kodeksining 77-84-moddalariga asosan...

8. IMZOLAR
Ish beruvchi: ____________________ {employer_name}
Ishchi: ____________________ {employee_name}
""",
                legal_references=["O'zbekiston Respublikasi Mehnat Kodeksi 77-84-moddalar"],
                preview_text="Ishchi va ish beruvchi o'rtasidagi mehnat shartnomasi...",
                language=Language.UZBEK
            )
        ])
        
        # Oilaviy shablonlar
        templates.extend([
            DocumentTemplate(
                id="divorce_application",
                name="Ajralish arizasi",
                description="Nikohni bekor qilish to'g'risida ariza",
                category="family",
                document_type=DocumentType.APPLICATION,
                fields=[
                    DocumentField("court_name", "Sud nomi", "text", True),
                    DocumentField("husband_name", "Er nomi", "text", True),
                    DocumentField("wife_name", "Xotin nomi", "text", True),
                    DocumentField("marriage_date", "Nikoh sanasi", "date", True),
                    DocumentField("children_count", "Bolalar soni", "number", False),
                    DocumentField("property_division", "Mulkni taqsimlash", "textarea", False),
                    DocumentField("alimony", "Aliment", "textarea", False),
                    DocumentField("reason", "Ajralish sababi", "textarea", True)
                ],
                content_template="""
AJRALISH TO'G'RISIDA ARIZA

{court_name}ga

Ariza beruvchi: {husband_name}
Qarama-qarshi tomon: {wife_name}

NIKOHLANGAN SANA: {marriage_date}

AJRALISH SABLARI
{reason}

BOLALAR HAQIDA
Bolalar soni: {children_count}

MULKNI TAQSIMLASH
{property_division}

ALIMENT TO'LASH
{aliment}

QONUNIY ASOSLAR
O'zbekiston Respublikasi Oila Kodeksining 126-139-moddalariga asosan...

SANA: {current_date}
IMZO: ____________________ {husband_name}
""",
                legal_references=["O'zbekiston Respublikasi Oila Kodeksi 126-139-moddalar"],
                preview_text="Nikohni bekor qilish to'g'risida ariza...",
                language=Language.UZBEK
            )
        ])
        
        # Jinoyiy shablonlar
        templates.extend([
            DocumentTemplate(
                id="criminal_complaint",
                name="Jinoyat ishi bo'yicha shikoyat",
                description="Jinoyat ishi bo'yicha shikoyat arizasi",
                category="criminal",
                document_type=DocumentType.COMPLAINT,
                fields=[
                    DocumentField("investigation_body", "Tergov organi", "text", True),
                    DocumentField("complainant_name", "Shikoyatchi nomi", "text", True),
                    DocumentField("complainant_address", "Shikoyatchi manzili", "text", True),
                    DocumentField("accused_name", "Ayblanuvchi nomi", "text", True),
                    DocumentField("crime_description", "Jinoyat tavsifi", "textarea", True),
                    DocumentField("crime_date", "Jinoyat sanasi", "date", True),
                    DocumentField("crime_location", "Jinoyat joyi", "text", True),
                    DocumentField("evidence", "Dalillar", "textarea", False)
                ],
                content_template="""
SHIKOYAT ARIZASI

{investigation_body}ga

Shikoyatchi: {complainant_name}
Manzili: {complainant_address}

AYBLANUVCHI HAQIDA
{accused_name}

JINOYAT TAVSIFI
{crime_description}

JINOYAT SANASI: {crime_date}
JINOYAT JOYI: {crime_location}

DALILLAR
{evidence}

QONUNIY ASOSLAR
O'zbekiston Respublikasi Jinoyat Kodeksining tegishli moddalariga asosan...

SANA: {current_date}
IMZO: ____________________ {complainant_name}
""",
                legal_references=["O'zbekiston Respublikasi Jinoyat Kodeksi", "O'zbekiston Respublikasi Jinoyat protsessual kodeksi"],
                preview_text="Jinoyat ishi bo'yicha shikoyat arizasi...",
                language=Language.UZBEK
            )
        ])
        
        # Vakolatnoma shablonlari
        templates.extend([
            DocumentTemplate(
                id="power_of_attorney",
                name="Vakolatnoma",
                description="Umumiy vakolatnoma shabloni",
                category="civil",
                document_type=DocumentType.POWER_OF_ATTORNEY,
                fields=[
                    DocumentField("principal_name", "Vakolat beruvchi nomi", "text", True),
                    DocumentField("principal_address", "Vakolat beruvchi manzili", "text", True),
                    DocumentField("attorney_name", "Vakolatli shaxs nomi", "text", True),
                    DocumentField("attorney_passport", "Vakolatli shaxs pasporti", "text", True),
                    DocumentField("attorney_address", "Vakolatli shaxs manzili", "text", True),
                    DocumentField("powers", "Vakolatlar", "textarea", True),
                    DocumentField("duration", "Vakolat muddati", "text", False),
                    DocumentField("start_date", "Boshlanish sanasi", "date", True),
                    DocumentField("end_date", "Tugash sanasi", "date", False)
                ],
                content_template="""
VAKOLATNOMA

Men, {principal_name}, {principal_address} manzilda yashovchi fuqaro,
{attorney_name} ({attorney_passport}, {attorney_address} manzilda yashovchi) ga quyidagi vakolatlarni beraman:

VAKOLATLAR
{powers}

VAKOLAT MuddATI
{duration}

BOSHLANISH SANASI: {start_date}
TUGASH SANASI: {end_date}

QONUNIY ASOSLAR
O'zbekiston Respublikasi Fuqarolik Kodeksining 126-132-moddalariga asosan...

SANA: {current_date}
VAKOLAT BERUVCHI: ____________________ {principal_name}
VAKOLATLI SHAXS: ____________________ {attorney_name}
""",
                legal_references=["O'zbekiston Respublikasi Fuqarolik Kodeksi 126-132-moddalar"],
                preview_text="Umumiy vakolatnoma huquqiy ishlarni bajarish uchun...",
                language=Language.UZBEK
            )
        ])
        
        return templates
    
    async def _get_template_by_id(self, template_id: str) -> Optional[DocumentTemplate]:
        """ID bo'yicha shablonni olish"""
        for template in self.document_templates:
            if template.id == template_id:
                return template
        return None
    
    def _validate_document_data(self, template: DocumentTemplate, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hujjat ma'lumotlarini tekshirish"""
        validated_data = {}
        
        for field in template.fields:
            field_value = document_data.get(field.id)
            
            # Required tekshiruvi
            if field.required and not field_value:
                raise Exception(f"'{field.name}' maydoni to'ldirilishi shart")
            
            # Type tekshiruvi
            if field_value:
                if field.type == "number":
                    try:
                        validated_data[field.id] = float(field_value)
                    except ValueError:
                        raise Exception(f"'{field.name}' maydoni raqam bo'lishi kerak")
                elif field.type == "date":
                    # Sana formatini tekshirish
                    validated_data[field.id] = field_value
                elif field.type == "select":
                    if field.options and field_value not in field.options:
                        raise Exception(f"'{field.name}' maydoni noto'g'ri qiymat")
                    validated_data[field.id] = field_value
                else:
                    validated_data[field.id] = str(field_value)
            else:
                validated_data[field.id] = field.default_value or ""
        
        return validated_data
    
    def _generate_document_content(self, template: DocumentTemplate, validated_data: Dict[str, Any], custom_fields: Dict[str, Any]) -> str:
        """Hujjat mazmunini yaratish"""
        content = template.content_template
        
        # Maydonlarni almashtirish
        for field_id, value in validated_data.items():
            content = content.replace(f"{{{field_id}}}", str(value))
        
        # Qo'shimcha maydonlarni almashtirish
        for field_id, value in custom_fields.items():
            content = content.replace(f"{{{field_id}}}", str(value))
        
        # Standart maydonlarni almashtirish
        current_date = datetime.now().strftime("%d.%m.%Y")
        content = content.replace("{current_date}", current_date)
        
        return content
    
    async def _create_file(self, content: str, output_format: str) -> Optional[str]:
        """Fayl yaratish (mock implementation)"""
        # Haqiqiy implementationda fayl yaratish va saqlash bo'ladi
        file_url = f"/documents/generated/{uuid.uuid4()}.{output_format}"
        return file_url
    
    def _field_to_dict(self, field: DocumentField) -> Dict[str, Any]:
        """Field ni dict ga o'tkazish"""
        return {
            "id": field.id,
            "name": field.name,
            "type": field.type,
            "required": field.required,
            "default_value": field.default_value,
            "options": field.options,
            "validation": field.validation,
            "placeholder": field.placeholder
        }
    
    def _get_category_name(self, category: str) -> str:
        """Kategoriya nomini olish"""
        names = {
            "civil": "Fuqarolik",
            "criminal": "Jinoyat",
            "family": "Oilaviy",
            "labor": "Mehnat",
            "administrative": "Ma'muriy",
            "commercial": "Tijorat",
            "property": "Mulk",
            "inheritance": "Vorislik"
        }
        return names.get(category, category)
    
    def _get_category_description(self, category: str) -> str:
        """Kategoriya tavsifini olish"""
        descriptions = {
            "civil": "Fuqarolik huquqiy munosabatlari bilan bog'liq hujjatlar",
            "criminal": "Jinoyat ishlari bilan bog'liq hujjatlar",
            "family": "Oilaviy huquqiy munosabatlar bilan bog'liq hujjatlar",
            "labor": "Mehnat munosabatlari bilan bog'liq hujjatlar",
            "administrative": "Ma'muriy huquqbuzarliklar bilan bog'liq hujjatlar",
            "commercial": "Tijorat faoliyati bilan bog'liq hujjatlar",
            "property": "Mulk huquqlari bilan bog'liq hujjatlar",
            "inheritance": "Vorislik huquqlari bilan bog'liq hujjatlar"
        }
        return descriptions.get(category, "Kategoriya tavsifi mavjud emas")
