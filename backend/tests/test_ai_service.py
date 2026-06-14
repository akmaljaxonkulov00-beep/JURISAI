"""
Tests for AI Service
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from services.ai_service_real import (
    RealAIService,
    AIRequest,
    AIResponse,
    AIModelType,
    AIProvider,
)

@pytest.fixture
def ai_service():
    """Create AI service instance for testing"""
    return RealAIService()

@pytest.fixture
def sample_request():
    """Create sample AI request"""
    return AIRequest(
        model_type=AIModelType.IRAC_ANALYSIS,
        input_text="Test legal case about contract dispute",
        temperature=0.7,
        max_tokens=500,
        user_id="test-user-123"
    )

class TestRealAIService:
    """Test suite for Real AI Service"""
    
    def test_initialization(self, ai_service):
        """Test service initialization"""
        assert ai_service is not None
        assert isinstance(ai_service.providers, dict)
        assert len(ai_service.provider_priority) > 0
    
    def test_provider_selection(self, ai_service):
        """Test automatic provider selection"""
        provider = ai_service._select_provider()
        assert isinstance(provider, AIProvider)
    
    def test_system_prompt_generation(self, ai_service):
        """Test system prompt for different model types"""
        for model_type in AIModelType:
            prompt = ai_service._get_system_prompt(model_type)
            assert isinstance(prompt, str)
            assert len(prompt) > 0
            assert "Uzbekistan" in prompt or "legal" in prompt.lower()
    
    def test_confidence_score_calculation(self, ai_service, sample_request):
        """Test confidence score calculation"""
        # Short response
        short_score = ai_service._calculate_confidence_score(
            sample_request,
            "Short response"
        )
        assert 0.0 <= short_score <= 1.0
        
        # Long response with legal terms
        long_response = " ".join([
            "Legal analysis according to article 10 of the Civil Code.",
            "The court must apply the statute and regulation pursuant to law.",
            "This legal opinion is based on relevant code provisions."
        ] * 10)
        long_score = ai_service._calculate_confidence_score(
            sample_request,
            long_response
        )
        assert long_score > short_score
        assert 0.0 <= long_score <= 1.0
    
    def test_get_available_providers(self, ai_service):
        """Test getting available providers"""
        providers = ai_service.get_available_providers()
        assert isinstance(providers, list)
        assert 'fallback' in providers
    
    @pytest.mark.asyncio
    async def test_process_request_fallback(self, ai_service, sample_request):
        """Test request processing with fallback"""
        # Force fallback provider
        sample_request.provider = AIProvider.FALLBACK
        
        with patch('backend.services.ai_service.ai_service') as mock_fallback:
            mock_response = AIResponse(
                model_type=sample_request.model_type,
                response_text="Mock response",
                confidence_score=0.8,
                processing_time=0.1,
                provider=AIProvider.FALLBACK,
                metadata={},
                timestamp=datetime.utcnow()
            )
            mock_fallback.process_request = AsyncMock(return_value=mock_response)
            
            response = await ai_service.process_request(sample_request)
            
            assert isinstance(response, AIResponse)
            assert response.model_type == sample_request.model_type
            assert response.provider == AIProvider.FALLBACK
    
    @pytest.mark.asyncio
    @patch.dict('os.environ', {'GROQ_API_KEY': 'test-key'})
    async def test_process_with_groq(self, ai_service, sample_request):
        """Test processing with Groq"""
        if AIProvider.GROQ not in ai_service.providers:
            pytest.skip("Groq not available")
        
        with patch.object(
            ai_service.providers[AIProvider.GROQ].chat.completions,
            'create'
        ) as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [
                Mock(message=Mock(content="Test response from Groq"))
            ]
            mock_create.return_value = mock_completion
            
            response = await ai_service._process_with_groq(
                sample_request,
                "Test system prompt"
            )
            
            assert isinstance(response, str)
            assert len(response) > 0
    
    def test_request_validation(self, sample_request):
        """Test AI request validation"""
        assert sample_request.model_type in AIModelType
        assert isinstance(sample_request.input_text, str)
        assert len(sample_request.input_text) > 0
        assert 0.0 <= sample_request.temperature <= 1.0
        assert sample_request.max_tokens > 0

@pytest.mark.integration
class TestAIServiceIntegration:
    """Integration tests for AI service"""
    
    @pytest.mark.asyncio
    async def test_full_request_cycle(self, ai_service, sample_request):
        """Test complete request-response cycle"""
        try:
            response = await ai_service.process_request(sample_request)
            
            assert isinstance(response, AIResponse)
            assert response.model_type == sample_request.model_type
            assert len(response.response_text) > 0
            assert 0.0 <= response.confidence_score <= 1.0
            assert response.processing_time > 0
            assert isinstance(response.provider, AIProvider)
            
        except Exception as e:
            # Should at least work with fallback
            assert False, f"Even fallback failed: {e}"
    
    @pytest.mark.asyncio
    async def test_multiple_model_types(self, ai_service):
        """Test processing different model types"""
        test_cases = [
            (AIModelType.IRAC_ANALYSIS, "Contract dispute case"),
            (AIModelType.LEGAL_RESEARCH, "Find laws about property"),
            (AIModelType.WEAKNESS_DETECTION, "This argument is weak"),
        ]
        
        for model_type, input_text in test_cases:
            request = AIRequest(
                model_type=model_type,
                input_text=input_text,
                temperature=0.7,
                max_tokens=300
            )
            
            response = await ai_service.process_request(request)
            assert isinstance(response, AIResponse)
            assert response.model_type == model_type
