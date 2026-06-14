"""
Real AI Service - Groq Only
Fast and free Llama models via Groq API
"""

import os
from typing import Dict, Optional, Any
from datetime import datetime

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("WARNING: Groq SDK not installed. Run: pip install groq")

from core.logging import get_logger
from core.error_handling import handle_errors, ExternalServiceError

logger = get_logger(__name__)


class GroqAIService:
    """Production AI Service using Groq (Llama models)"""
    
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
        self.client = self._initialize_groq()
        self.default_model = "llama-3.1-70b-versatile"
        
    def _initialize_groq(self) -> Optional[Groq]:
        """Initialize Groq client"""
        if not GROQ_AVAILABLE:
            self.logger.error("Groq SDK not installed!")
            return None
            
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            self.logger.error("GROQ_API_KEY not found!")
            return None
        
        try:
            client = Groq(api_key=groq_key)
            self.logger.info("✅ Groq initialized")
            return client
        except Exception as e:
            self.logger.error(f"❌ Groq init failed: {e}")
            return None
    
    @handle_errors(log_errors=True, reraise=False)
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate AI completion using Groq"""
        
        if not self.client:
            raise ExternalServiceError(
                "Groq client not initialized",
                service_name="Groq AI",
                details={"error": "Client is None"}
            )
        
        start_time = datetime.utcnow()
        model = model or self.default_model
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return {
                "provider": "groq",
                "model": model,
                "response": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "processing_time": processing_time,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Groq API error: {e}")
            raise ExternalServiceError(
                f"Groq API failed: {str(e)}",
                service_name="Groq AI",
                details={"model": model, "error": str(e)}
            )
    
    async def analyze_irac(self, legal_scenario: str) -> Dict[str, Any]:
        """IRAC analysis using Groq"""
        system_prompt = """You are an expert legal analyst specializing in IRAC methodology for Uzbekistan law.
Provide detailed analysis in Uzbek or Russian language."""
        
        prompt = f"""Quyidagi huquqiy vaziyatni IRAC metodologiyasi bo'yicha tahlil qiling:

Vaziyat: {legal_scenario}

Quyidagi formatda javob bering:

**ISSUE (Masala):**
[Huquqiy masalani aniqlang]

**RULE (Qoida):**
[Tegishli qonun va qoidalarni ko'rsating]

**APPLICATION (Qo'llash):**
[Qoidalarni faktlarga qo'llang]

**CONCLUSION (Xulosa):**
[Yakuniy xulosani bering]"""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=1500
        )
    
    async def generate_document(self, doc_type: str, details: str) -> Dict[str, Any]:
        """Generate legal document using Groq"""
        system_prompt = "You are a legal document generator for Uzbekistan legal system."
        
        prompt = f"""Generate a {doc_type} document based on:

{details}

Create a professional, properly formatted legal document in Uzbek or Russian."""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            max_tokens=2000
        )
    
    async def detect_weaknesses(self, legal_argument: str) -> Dict[str, Any]:
        """Detect weaknesses in legal argument"""
        system_prompt = "You are a legal analyst identifying weaknesses in legal arguments."
        
        prompt = f"""Analyze this legal argument and identify weaknesses:

{legal_argument}

Provide:
1. Identified weaknesses
2. Severity assessment
3. Recommendations

Respond in Uzbek or Russian."""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.4,
            max_tokens=1000
        )
    
    async def generate_scenario(self, topic: str, difficulty: str = "medium") -> Dict[str, Any]:
        """Generate legal scenario for education"""
        system_prompt = "You are a legal scenario generator for educational purposes."
        
        prompt = f"""Create a legal scenario about: {topic}
Difficulty level: {difficulty}

Include:
- Background story
- Legal issues
- Key facts
- Discussion points

Respond in Uzbek or Russian."""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=1500
        )
    
    async def simulate_court(self, case_details: str) -> Dict[str, Any]:
        """Simulate court proceedings"""
        system_prompt = "You are a court simulation expert for Uzbekistan legal system."
        
        prompt = f"""Simulate court proceedings for:

{case_details}

Include:
- Opening statements
- Evidence presentation
- Legal arguments
- Verdict with reasoning

Respond in Uzbek or Russian."""
        
        return await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.6,
            max_tokens=1800
        )


# Global instance
groq_ai_service = GroqAIService()


def get_ai_service() -> GroqAIService:
    """Get Groq AI service instance"""
    return groq_ai_service
