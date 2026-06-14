"""
Legal Database Service
O'zbekiston qonunchilik ma'lumotlar bazasi
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
    CODE = "code"
    LAW = "law"
    DECREE = "decree"
    REGULATION = "regulation"
    INSTRUCTION = "instruction"
    ORDER = "order"
    RESOLUTION = "resolution"
    CONSTITUTION = "constitution"

class LegalCategory(Enum):
    """Qonun kategoriyalari"""
    CONSTITUTIONAL = "constitutional"
    CIVIL = "civil"
    CRIMINAL = "criminal"
    FAMILY = "family"
    LABOR = "labor"
    ADMINISTRATIVE = "administrative"
    TAX = "tax"
    CUSTOMS = "customs"
    LAND = "land"
    ENVIRONMENTAL = "environmental"
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    BANKING = "banking"
    INSURANCE = "insurance"
    INTELLECTUAL_PROPERTY = "intellectual_property"

@dataclass
class LegalArticle:
    """Qonun moddasi"""
    id: str
    title: str
    content: str
    category: LegalCategory
    document_type: DocumentType
    article_number: str
    chapter: str
    section: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    cross_references: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    relevance_score: float = 0.0
    view_count: int = 0

@dataclass
class SearchResult:
    """Qidiruv natijasi"""
    articles: List[LegalArticle]
    total: int
    query: str
    search_time: float
    suggestions: List[str] = field(default_factory=list)

class LegalDatabaseService:
    """Legal Database Service - O'zbekiston qonunchiligiga moslashgan"""
    
    def __init__(self):
        self.uzbekistan_legal_framework = {
            "constitutional": {
                "name": "O'zbekiston Respublikasi Konstitutsiyasi",
                "document_type": DocumentType.CONSTITUTION,
                "total_articles": 128,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125]
            },
            "civil": {
                "name": "O'zbekiston Respublikasi Fuqarolik Kodeksi",
                "document_type": DocumentType.CODE,
                "total_articles": 705,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
            },
            "criminal": {
                "name": "O'zbekiston Respublikasi Jinoyat Kodeksi",
                "document_type": DocumentType.CODE,
                "total_articles": 278,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
            },
            "family": {
                "name": "O'zbekiston Respublikasi Oila Kodeksi",
                "document_type": DocumentType.CODE,
                "total_articles": 248,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
            },
            "labor": {
                "name": "O'zbekiston Respublikasi Mehnat Kodeksi",
                "document_type": DocumentType.CODE,
                "total_articles": 299,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
            },
            "administrative": {
                "name": "O'zbekiston Respublikasi Ma'muriy huquqbuzarlik to'g'risidagi Kodeksi",
                "document_type": DocumentType.CODE,
                "total_articles": 486,
                "key_articles": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]
            }
        }
        
        # Qonun ma'lumotlar bazasi (mock data)
        self.legal_articles = self._create_legal_articles()
        
        # Qidiruv indeksi
        self.search_index = self._build_search_index()
    
    async def search_documents(self, query: str, category: Optional[str], document_type: Optional[str], limit: int, offset: int, filters: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Qonun hujjatlarida qidiruv
        
        Args:
            query: Qidiruv so'zi
            category: Kategoriya
            document_type: Hujjat turi
            limit: Natijalar soni
            offset: Offset
            filters: Qo'shimcha filterlar
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Qidiruv natijalari
        """
        start_time = datetime.now()
        
        try:
            # Qidiruvni normalizatsiya qilish
            normalized_query = self._normalize_query(query)
            
            # Asosiy qidiruv
            matching_articles = self._search_articles(normalized_query, category, document_type, filters)
            
            # Relevance scoring
            scored_articles = self._calculate_relevance(matching_articles, normalized_query)
            
            # Natijalarni saralash
            sorted_articles = sorted(scored_articles, key=lambda x: x.relevance_score, reverse=True)
            
            # Pagination
            total = len(sorted_articles)
            paginated_articles = sorted_articles[offset:offset + limit]
            
            # Takliflar generatsiyasi
            suggestions = self._generate_suggestions(normalized_query)
            
            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Natijani tayyorlash
            result = {
                "articles": [self._article_to_dict(article) for article in paginated_articles],
                "total": total,
                "query": query,
                "search_time": processing_time,
                "suggestions": suggestions
            }
            
            logger.info(f"Search completed for user {user_id}, query: {query}, results: {total}")
            return result
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            raise Exception(f"Qidiruv xatolik: {str(e)}")
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """
        Qonun kategoriyalarini olish
        
        Returns:
            List: Kategoriyalar ro'yxati
        """
        try:
            categories = []
            
            for category in LegalCategory:
                # Har bir kategoriya uchun ma'lumotlarni hisoblash
                category_articles = [article for article in self.legal_articles if article.category == category]
                
                categories.append({
                    "id": category.value,
                    "name": self._get_category_name(category),
                    "description": self._get_category_description(category),
                    "document_count": len(category_articles),
                    "document_type": self.uzbekistan_legal_framework.get(category.value, {}).get("document_type", {}).value
                })
            
            return categories
            
        except Exception as e:
            logger.error(f"Get categories error: {str(e)}")
            raise Exception(f"Kategoriyalarni olish xatolik: {str(e)}")
    
    async def get_document(self, document_id: str, include_related: bool, include_references: bool, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Ma'lum bir qonun hujjatini olish
        
        Args:
            document_id: Hujjat ID
            include_related: Bog'liq hujjatlar
            include_references: Havolalar
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Hujjat ma'lumotlari
        """
        try:
            # Hujjatni qidirish
            article = next((article for article in self.legal_articles if article.id == document_id), None)
            
            if not article:
                return None
            
            # View count ni oshirish
            article.view_count += 1
            
            # Asosiy ma'lumotlar
            document_data = self._article_to_dict(article)
            
            # Bog'liq hujjatlar
            if include_related:
                related_docs = await self.get_related_documents(document_id, 5, user_id)
                document_data["related_documents"] = related_docs["related_documents"]
            
            # Havolalar
            if include_references:
                references = await self.get_document_references(document_id, user_id)
                document_data["references"] = references["references"]
            
            logger.info(f"Document viewed: {document_id} by user {user_id}")
            return document_data
            
        except Exception as e:
            logger.error(f"Get document error: {str(e)}")
            raise Exception(f"Hujjatni olish xatolik: {str(e)}")
    
    async def get_related_documents(self, document_id: str, limit: int, user_id: str) -> Dict[str, Any]:
        """
        Bog'liq hujjatlarni olish
        
        Args:
            document_id: Hujjat ID
            limit: Natijalar soni
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Bog'liq hujjatlar
        """
        try:
            # Hujjatni topish
            current_article = next((article for article in self.legal_articles if article.id == document_id), None)
            
            if not current_article:
                return {"related_documents": []}
            
            # Bog'liq hujjatlarni topish
            related_articles = []
            
            # Xuddi shu kategoriyadagi boshqa hujjatlar
            same_category = [article for article in self.legal_articles 
                           if article.category == current_article.category and article.id != document_id]
            related_articles.extend(same_category[:limit//2])
            
            # Xuddi shu bobdagi boshqa hujjatlar
            same_chapter = [article for article in self.legal_articles 
                           if article.chapter == current_article.chapter and article.id != document_id]
            related_articles.extend(same_chapter[:limit//2])
            
            # Cross references
            for ref_id in current_article.cross_references:
                ref_article = next((article for article in self.legal_articles if article.id == ref_id), None)
                if ref_article and len(related_articles) < limit:
                    related_articles.append(ref_article)
            
            # Natijalarni cheklash
            final_related = related_articles[:limit]
            
            return {
                "related_documents": [self._article_to_dict(article) for article in final_related]
            }
            
        except Exception as e:
            logger.error(f"Get related documents error: {str(e)}")
            raise Exception(f"Bog'liq hujjalarni olish xatolik: {str(e)}")
    
    async def get_document_references(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """
        Hujjat havolalarini olish
        
        Args:
            document_id: Hujjat ID
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Havolalar
        """
        try:
            # Hujjatni topish
            article = next((article for article in self.legal_articles if article.id == document_id), None)
            
            if not article:
                return {"references": []}
            
            # Havolalarni tayyorlash
            references = []
            
            for ref_id in article.cross_references:
                ref_article = next((a for a in self.legal_articles if a.id == ref_id), None)
                if ref_article:
                    references.append({
                        "id": ref_article.id,
                        "title": ref_article.title,
                        "article_number": ref_article.article_number,
                        "reference_type": "cross_reference"
                    })
            
            return {
                "references": references
            }
            
        except Exception as e:
            logger.error(f"Get document references error: {str(e)}")
            raise Exception(f"Havolalarni olish xatolik: {str(e)}")
    
    async def get_popular_documents(self, limit: int, category: Optional[str], user_id: str) -> List[Dict[str, Any]]:
        """
        Mashhur qonun hujjatlari
        
        Args:
            limit: Natijalar soni
            category: Kategoriya
            user_id: Foydalanuvchi ID
            
        Returns:
            List: Mashhur hujjatlar
        """
        try:
            # Eng ko'p ko'rilgan hujjatlar
            all_articles = self.legal_articles.copy()
            
            # Kategoriya bo'yicha filtrlash
            if category:
                all_articles = [article for article in all_articles if article.category.value == category]
            
            # View count bo'yicha saralash
            sorted_articles = sorted(all_articles, key=lambda x: x.view_count, reverse=True)
            
            # Natijalarni cheklash
            popular_articles = sorted_articles[:limit]
            
            return [self._article_to_dict(article) for article in popular_articles]
            
        except Exception as e:
            logger.error(f"Get popular documents error: {str(e)}")
            raise Exception(f"Mashhur hujjalarni olish xatolik: {str(e)}")
    
    async def get_database_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Qonunlar bazasi statistikasi
        
        Args:
            user_id: Foydalanuvchi ID
            
        Returns:
            Dict: Statistika
        """
        try:
            # Umumiy statistika
            total_documents = len(self.legal_articles)
            
            # Kategoriyalar bo'yicha statistika
            category_stats = {}
            for article in self.legal_articles:
                category = article.category.value
                category_stats[category] = category_stats.get(category, 0) + 1
            
            # Hujjat turlari bo'yicha statistika
            type_stats = {}
            for article in self.legal_articles:
                doc_type = article.document_type.value
                type_stats[doc_type] = type_stats.get(doc_type, 0) + 1
            
            # Eng ko'p ko'rilgan hujjatlar
            most_viewed = sorted(self.legal_articles, key=lambda x: x.view_count, reverse=True)[:5]
            
            return {
                "total_documents": total_documents,
                "category_distribution": category_stats,
                "document_type_distribution": type_stats,
                "most_viewed_documents": [self._article_to_dict(article) for article in most_viewed],
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Get database stats error: {str(e)}")
            raise Exception(f"Statistikani olish xatolik: {str(e)}")
    
    async def get_search_suggestions(self, query: str, limit: int, user_id: str) -> List[str]:
        """
        Qidiruv takliflari
        
        Args:
            query: Qidiruv so'zi
            limit: Takliflar soni
            user_id: Foydalanuvchi ID
            
        Returns:
            List: Takliflar
        """
        try:
            suggestions = []
            
            # Kalit so'zlardan takliflar
            for keyword in self.search_index.get("keywords", []):
                if query.lower() in keyword.lower() and keyword not in suggestions:
                    suggestions.append(keyword)
                    if len(suggestions) >= limit:
                        break
            
            # Modda raqamlaridan takliflar
            for article in self.legal_articles:
                if query.lower() in article.article_number.lower() and article.title not in suggestions:
                    suggestions.append(article.title)
                    if len(suggestions) >= limit:
                        break
            
            return suggestions[:limit]
            
        except Exception as e:
            logger.error(f"Get search suggestions error: {str(e)}")
            raise Exception(f"Takliflarni olish xatolik: {str(e)}")
    
    def _create_legal_articles(self) -> List[LegalArticle]:
        """Qonun ma'lumotlar bazasini yaratish (mock data)"""
        articles = []
        
        # Konstitutsiya moddalari
        for i in range(1, 129):
            article = LegalArticle(
                id=f"const_{i}",
                title=f"O'zbekiston Respublikasi Konstitutsiyasi {i}-modda",
                content=f"Konstitutsiyaning {i}-moddasi mazmuri. Bu modda O'zbekiston Respublikasining asosiy huquqiy prinsiplarini belgilaydi.",
                category=LegalCategory.CONSTITUTIONAL,
                document_type=DocumentType.CONSTITUTION,
                article_number=f"{i}-modda",
                chapter=self._get_chapter_from_number(i, "constitutional"),
                keywords=["konstitutsiya", "huquq", "davlat", "fuqaro"],
                cross_references=[],
                view_count=random.randint(10, 1000)
            )
            articles.append(article)
        
        # Fuqarolik kodeksi moddalari
        for i in range(1, 706):
            article = LegalArticle(
                id=f"civil_{i}",
                title=f"Fuqarolik Kodeksi {i}-modda",
                content=f"Fuqarolik kodeksining {i}-moddasi. Bu modda fuqarolik huquqiy munosabatlarini tartibga soladi.",
                category=LegalCategory.CIVIL,
                document_type=DocumentType.CODE,
                article_number=f"{i}-modda",
                chapter=self._get_chapter_from_number(i, "civil"),
                keywords=["fuqarolik", "huquq", "shartnoma", "majburiyat"],
                cross_references=[],
                view_count=random.randint(5, 500)
            )
            articles.append(article)
        
        # Jinoyat kodeksi moddalari
        for i in range(1, 279):
            article = LegalArticle(
                id=f"criminal_{i}",
                title=f"Jinoyat Kodeksi {i}-modda",
                content=f"Jinoyat kodeksining {i}-moddasi. Bu modda jinoyat tarkibini va javobgarlikni belgilaydi.",
                category=LegalCategory.CRIMINAL,
                document_type=DocumentType.CODE,
                article_number=f"{i}-modda",
                chapter=self._get_chapter_from_number(i, "criminal"),
                keywords=["jinoyat", "javobgarlik", "jazo", "tergov"],
                cross_references=[],
                view_count=random.randint(8, 800)
            )
            articles.append(article)
        
        # Boshqa kodekslar moddalari
        other_codes = {
            "family": (LegalCategory.FAMILY, 248),
            "labor": (LegalCategory.LABOR, 299),
            "administrative": (LegalCategory.ADMINISTRATIVE, 486)
        }
        
        for code_name, (category, total_articles) in other_codes.items():
            for i in range(1, total_articles + 1):
                article = LegalArticle(
                    id=f"{code_name}_{i}",
                    title=f"{self._get_category_name(category)} Kodeksi {i}-modda",
                    content=f"{self._get_category_name(category)} kodeksining {i}-moddasi mazmuri.",
                    category=category,
                    document_type=DocumentType.CODE,
                    article_number=f"{i}-modda",
                    chapter=self._get_chapter_from_number(i, code_name),
                    keywords=[code_name, "huquq", "modda"],
                    cross_references=[],
                    view_count=random.randint(3, 300)
                )
                articles.append(article)
        
        return articles
    
    def _build_search_index(self) -> Dict[str, Any]:
        """Qidiruv indeksini yaratish"""
        index = {
            "keywords": set(),
            "titles": {},
            "content": {}
        }
        
        for article in self.legal_articles:
            # Kalit so'zlarni indekslash
            for keyword in article.keywords:
                index["keywords"].add(keyword.lower())
            
            # Sarlavhalarni indekslash
            index["titles"][article.id] = article.title.lower()
            
            # Mazmuni indekslash
            index["content"][article.id] = article.content.lower()
        
        return index
    
    def _normalize_query(self, query: str) -> str:
        """Qidiruv so'zini normalizatsiya qilish"""
        # Kichik harflarga o'tkazish
        normalized = query.lower().strip()
        
        # Ortiqcha bo'shliqlarni olib tashlash
        normalized = re.sub(r'\s+', ' ', normalized)
        
        return normalized
    
    def _search_articles(self, query: str, category: Optional[str], document_type: Optional[str], filters: Dict[str, Any]) -> List[LegalArticle]:
        """Maqolalarda qidiruv"""
        matching_articles = []
        
        for article in self.legal_articles:
            # Kategoriya bo'yicha filtrlash
            if category and article.category.value != category:
                continue
            
            # Hujjat turi bo'yicha filtrlash
            if document_type and article.document_type.value != document_type:
                continue
            
            # Asosiy qidiruv
            if self._matches_query(article, query):
                matching_articles.append(article)
        
        return matching_articles
    
    def _matches_query(self, article: LegalArticle, query: str) -> bool:
        """Maqola qidiruvga mos kelishini tekshirish"""
        query_lower = query.lower()
        
        # Sarlavhada qidirish
        if query_lower in article.title.lower():
            return True
        
        # Mazmunda qidirish
        if query_lower in article.content.lower():
            return True
        
        # Kalit so'zlarda qidirish
        for keyword in article.keywords:
            if query_lower in keyword.lower():
                return True
        
        # Modda raqamida qidirish
        if query_lower in article.article_number.lower():
            return True
        
        return False
    
    def _calculate_relevance(self, articles: List[LegalArticle], query: str) -> List[LegalArticle]:
        """Relevance hisoblash"""
        query_lower = query.lower()
        
        for article in articles:
            score = 0.0
            
            # Sarlavha mosligi
            if query_lower in article.title.lower():
                score += 0.8
            
            # Modda raqami mosligi
            if query_lower in article.article_number.lower():
                score += 0.9
            
            # Kalit so'z mosligi
            keyword_matches = sum(1 for keyword in article.keywords if query_lower in keyword.lower())
            score += keyword_matches * 0.3
            
            # Mazmun mosligi
            content_matches = article.content.lower().count(query_lower)
            score += content_matches * 0.1
            
            # View count (mashhurlik)
            score += min(article.view_count / 1000, 0.2)
            
            article.relevance_score = score
        
        return articles
    
    def _generate_suggestions(self, query: str) -> List[str]:
        """Takliflar generatsiyasi"""
        suggestions = []
        
        # Xuddi shu so'z bilan boshlanadigan kalit so'zlar
        for keyword in self.search_index.get("keywords", []):
            if keyword.startswith(query.lower()) and len(suggestions) < 5:
                suggestions.append(keyword)
        
        return suggestions[:5]
    
    def _get_chapter_from_number(self, article_number: int, code_type: str) -> str:
        """Modda raqamidan bobni aniqlash"""
        chapter_mappings = {
            "constitutional": {
                1: "Asosiy qoidalar", 2: "Fuqarolarning huquq va majburiyatlari", 3: "Inson huquqlari"
            },
            "civil": {
                1: "Umumiy qoidalar", 2: "Shaxslar", 3: "Obyektlar", 4: "Huquqiy aktlar"
            },
            "criminal": {
                1: "Umumiy qoidalar", 2: "Jinoyatlar tasnifi", 3: "Jazolar"
            },
            "family": {
                1: "Umumiy qoidalar", 2: "Nikoh", 3: "Oila mulki", 4: "Aliment"
            },
            "labor": {
                1: "Umumiy qoidalar", 2: "Ish haqqi", 3: "Ish vaqti", 4: "Ishdan bo'shatish"
            },
            "administrative": {
                1: "Umumiy qoidalar", 2: "Ma'muriy huquqbuzarliklar", 3: "Jarimalar"
            }
        }
        
        mappings = chapter_mappings.get(code_type, {})
        
        for range_end, chapter_name in mappings.items():
            if article_number <= range_end * 50:
                return chapter_name
        
        return "Boshqa boblar"
    
    def _get_category_name(self, category: LegalCategory) -> str:
        """Kategoriya nomini olish"""
        names = {
            LegalCategory.CONSTITUTIONAL: "Konstitutsiyaviy",
            LegalCategory.CIVIL: "Fuqarolik",
            LegalCategory.CRIMINAL: "Jinoyat",
            LegalCategory.FAMILY: "Oilaviy",
            LegalCategory.LABOR: "Mehnat",
            LegalCategory.ADMINISTRATIVE: "Ma'muriy",
            LegalCategory.TAX: "Soliq",
            LegalCategory.CUSTOMS: "Bojxona",
            LegalCategory.LAND: "Yer",
            LegalCategory.ENVIRONMENTAL: "Atrof-muhit",
            LegalCategory.EDUCATION: "Ta'lim",
            LegalCategory.HEALTHCARE: "Sog'liqni saqlash",
            LegalCategory.BANKING: "Bank",
            LegalCategory.INSURANCE: "Sug'urta",
            LegalCategory.INTELLECTUAL_PROPERTY: "Intellektual mulk"
        }
        return names.get(category, category.value)
    
    def _get_category_description(self, category: LegalCategory) -> str:
        """Kategoriya tavsifini olish"""
        descriptions = {
            LegalCategory.CONSTITUTIONAL: "O'zbekiston Konstitutsiyasi va konstitutsiyaviy huquq",
            LegalCategory.CIVIL: "Fuqarolik huquqiy munosabatlari va fuqarolik kodeksi",
            LegalCategory.CRIMINAL: "Jinoyat huquqi va jinoyat kodeksi",
            LegalCategory.FAMILY: "Oilaviy huquqiy munosabatlar va oila kodeksi",
            LegalCategory.LABOR: "Mehnat huquqi va mehnat kodeksi",
            LegalCategory.ADMINISTRATIVE: "Ma'muriy huquqbuzarliklar va ma'muriy javobgarlik",
            LegalCategory.TAX: "Soliq tizimi va soliq qonunchiligi",
            LegalCategory.CUSTOMS: "Bojxona tizimi va bojxona qonunchiligi",
            LegalCategory.LAND: "Yer resurslari va yer huquqi",
            LegalCategory.ENVIRONMENTAL: "Atrof-muhitni muhofaza qilish",
            LegalCategory.EDUCATION: "Ta'lim tizimi va ta'lim huquqi",
            LegalCategory.HEALTHCARE: "Sog'liqni saqlash tizimi",
            LegalCategory.BANKING: "Bank faoliyati va bank qonunchiligi",
            LegalCategory.INSURANCE: "Sug'urta faoliyati",
            LegalCategory.INTELLECTUAL_PROPERTY: "Intellektual mulk huquqi"
        }
        return descriptions.get(category, "Kategoriya tavsifi mavjud emas")
    
    def _article_to_dict(self, article: LegalArticle) -> Dict[str, Any]:
        """Article ni dict ga o'tkazish"""
        return {
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "category": article.category.value,
            "document_type": article.document_type.value,
            "article_number": article.article_number,
            "chapter": article.chapter,
            "section": article.section,
            "keywords": article.keywords,
            "cross_references": article.cross_references,
            "last_updated": article.last_updated.isoformat(),
            "relevance_score": article.relevance_score,
            "view_count": article.view_count
        }
