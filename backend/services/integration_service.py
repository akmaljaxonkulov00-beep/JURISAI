"""
Integration Service - External system integration for JurisAI platform
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import json
import aiohttp
import requests
from dataclasses import dataclass, field
from enum import Enum
from urllib.parse import urljoin, urlparse
import hashlib
import hmac

from core.logging import get_logger, performance_logger
from core.error_handling import handle_errors, JurisAIException, ExternalServiceError
from services.cache_service import CacheService, cached

logger = get_logger(__name__)

class IntegrationType(Enum):
    """Types of external integrations"""
    LEGAL_DATABASE = "legal_database"
    COURT_SYSTEM = "court_system"
    GOVERNMENT_PORTAL = "government_portal"
    PAYMENT_GATEWAY = "payment_gateway"
    NOTIFICATION_SERVICE = "notification_service"
    BACKUP_SERVICE = "backup_service"
    ANALYTICS_SERVICE = "analytics_service"
    AUTHENTICATION_SERVICE = "authentication_service"

class RequestMethod(Enum):
    """HTTP request methods"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"

class AuthenticationType(Enum):
    """Authentication types"""
    NONE = "none"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    HMAC = "hmac"

@dataclass
class IntegrationConfig:
    """Integration configuration"""
    name: str
    integration_type: IntegrationType
    base_url: str
    authentication_type: AuthenticationType
    credentials: Dict[str, str]
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    retry_attempts: int = 3
    rate_limit: Optional[int] = None  # requests per minute
    enabled: bool = True

@dataclass
class IntegrationRequest:
    """Integration request structure"""
    integration_name: str
    endpoint: str
    method: RequestMethod = RequestMethod.GET
    params: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    timeout: Optional[int] = None

@dataclass
class IntegrationResponse:
    """Integration response structure"""
    status_code: int
    data: Any
    headers: Dict[str, str]
    response_time: float
    cached: bool = False
    timestamp: datetime = field(default_factory=datetime.utcnow)

class RateLimiter:
    """Rate limiter for API calls"""
    
    def __init__(self, max_requests_per_minute: int):
        self.max_requests = max_requests_per_minute
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire rate limit"""
        async with self.lock:
            now = datetime.utcnow()
            # Remove requests older than 1 minute
            self.requests = [req_time for req_time in self.requests if now - req_time < timedelta(minutes=1)]
            
            # Check if we can make a request
            if len(self.requests) >= self.max_requests:
                # Calculate wait time
                oldest_request = min(self.requests)
                wait_time = timedelta(minutes=1) - (now - oldest_request)
                if wait_time.total_seconds() > 0:
                    await asyncio.sleep(wait_time.total_seconds())
            
            # Add current request
            self.requests.append(now)

class IntegrationService:
    """Advanced integration service for external systems"""
    
    def __init__(self, cache_service: Optional[CacheService] = None):
        self.logger = get_logger(self.__class__.__name__)
        self.cache_service = cache_service
        self.integrations: Dict[str, IntegrationConfig] = {}
        self.rate_limiters: Dict[str, RateLimiter] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.request_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "cached_requests": 0,
            "avg_response_time": 0.0
        }
        
        # Initialize built-in integrations
        self._initialize_builtin_integrations()
    
    def _initialize_builtin_integrations(self):
        """Initialize built-in system integrations"""
        
        # Legal Database Integration
        legal_db_config = IntegrationConfig(
            name="legal_database",
            integration_type=IntegrationType.LEGAL_DATABASE,
            base_url="https://api.legaldatabase.uz",
            authentication_type=AuthenticationType.API_KEY,
            credentials={"api_key": "legal_db_api_key_placeholder"},
            headers={"Content-Type": "application/json"},
            rate_limit=100
        )
        
        # Court System Integration
        court_system_config = IntegrationConfig(
            name="court_system",
            integration_type=IntegrationType.COURT_SYSTEM,
            base_url="https://api.court.gov.uz",
            authentication_type=AuthenticationType.BEARER_TOKEN,
            credentials={"token": "court_system_token_placeholder"},
            headers={"Content-Type": "application/json"},
            rate_limit=50
        )
        
        # Government Portal Integration
        gov_portal_config = IntegrationConfig(
            name="government_portal",
            integration_type=IntegrationType.GOVERNMENT_PORTAL,
            base_url="https://api.gov.uz",
            authentication_type=AuthenticationType.OAUTH2,
            credentials={"client_id": "gov_client_id", "client_secret": "gov_client_secret"},
            headers={"Content-Type": "application/json"},
            rate_limit=30
        )
        
        # Add integrations
        self.add_integration(legal_db_config)
        self.add_integration(court_system_config)
        self.add_integration(gov_portal_config)
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def add_integration(self, config: IntegrationConfig):
        """Add integration configuration"""
        self.integrations[config.name] = config
        
        # Initialize rate limiter if needed
        if config.rate_limit:
            self.rate_limiters[config.name] = RateLimiter(config.rate_limit)
        
        self.logger.info(f"Integration added: {config.name}")
    
    def remove_integration(self, name: str) -> bool:
        """Remove integration"""
        if name in self.integrations:
            del self.integrations[name]
            if name in self.rate_limiters:
                del self.rate_limiters[name]
            self.logger.info(f"Integration removed: {name}")
            return True
        return False
    
    def get_integration(self, name: str) -> Optional[IntegrationConfig]:
        """Get integration configuration"""
        return self.integrations.get(name)
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def make_request(self, request: IntegrationRequest, 
                          use_cache: bool = True, cache_ttl: Optional[timedelta] = None) -> IntegrationResponse:
        """
        Make HTTP request to integrated service
        
        Args:
            request (IntegrationRequest): Request details
            use_cache (bool): Whether to use cache
            cache_ttl (Optional[timedelta]): Cache time to live
            
        Returns:
            IntegrationResponse: Response from service
        """
        start_time = datetime.utcnow()
        
        try:
            # Get integration config
            config = self.integrations.get(request.integration_name)
            if not config:
                raise JurisAIException(
                    f"Integration not found: {request.integration_name}",
                    error_code="INTEGRATION_NOT_FOUND"
                )
            
            if not config.enabled:
                raise JurisAIException(
                    f"Integration disabled: {request.integration_name}",
                    error_code="INTEGRATION_DISABLED"
                )
            
            # Check cache
            cache_key = f"{request.integration_name}:{request.endpoint}:{hash(str(request.params))}:{hash(str(request.data))}"
            if use_cache and self.cache_service:
                cached_response = await self.cache_service.get("integration", cache_key)
                if cached_response:
                    self.request_stats["cached_requests"] += 1
                    return IntegrationResponse(
                        status_code=200,
                        data=cached_response,
                        headers={},
                        response_time=0.001,
                        cached=True
                    )
            
            # Apply rate limiting
            if request.integration_name in self.rate_limiters:
                await self.rate_limiters[request.integration_name].acquire()
            
            # Build URL
            url = urljoin(config.base_url, request.endpoint)
            
            # Prepare headers
            headers = config.headers.copy()
            if request.headers:
                headers.update(request.headers)
            
            # Add authentication
            auth_headers = self._get_authentication_headers(config)
            headers.update(auth_headers)
            
            # Make request
            response_data = await self._execute_http_request(
                url=url,
                method=request.method,
                headers=headers,
                params=request.params,
                data=request.data,
                timeout=request.timeout or config.timeout,
                retry_attempts=config.retry_attempts
            )
            
            # Calculate response time
            response_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create response
            response = IntegrationResponse(
                status_code=response_data.get("status_code", 200),
                data=response_data.get("data"),
                headers=response_data.get("headers", {}),
                response_time=response_time,
                cached=False
            )
            
            # Cache response
            if use_cache and self.cache_service and response.status_code == 200:
                cache_ttl = cache_ttl or timedelta(minutes=15)
                await self.cache_service.set("integration", response.data, cache_ttl, cache_key)
            
            # Update stats
            self._update_request_stats(response, response_time)
            
            return response
            
        except Exception as e:
            self.request_stats["failed_requests"] += 1
            self.logger.error(f"Integration request failed: {e}")
            raise ExternalServiceError(
                f"Integration request failed: {str(e)}",
                service_name=request.integration_name,
                details={"request": str(request)}
            )
    
    def _get_authentication_headers(self, config: IntegrationConfig) -> Dict[str, str]:
        """Get authentication headers based on auth type"""
        headers = {}
        
        if config.authentication_type == AuthenticationType.API_KEY:
            api_key = config.credentials.get("api_key")
            if api_key:
                headers["X-API-Key"] = api_key
        
        elif config.authentication_type == AuthenticationType.BEARER_TOKEN:
            token = config.credentials.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        
        elif config.authentication_type == AuthenticationType.BASIC_AUTH:
            username = config.credentials.get("username")
            password = config.credentials.get("password")
            if username and password:
                import base64
                credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
                headers["Authorization"] = f"Basic {credentials}"
        
        elif config.authentication_type == AuthenticationType.HMAC:
            api_key = config.credentials.get("api_key")
            secret = config.credentials.get("secret")
            if api_key and secret:
                timestamp = str(int(datetime.utcnow().timestamp()))
                signature = hmac.new(
                    secret.encode(),
                    f"{timestamp}{api_key}".encode(),
                    hashlib.sha256
                ).hexdigest()
                headers["X-API-Key"] = api_key
                headers["X-Timestamp"] = timestamp
                headers["X-Signature"] = signature
        
        return headers
    
    async def _execute_http_request(self, url: str, method: RequestMethod,
                                   headers: Dict[str, str], params: Optional[Dict[str, Any]] = None,
                                   data: Optional[Dict[str, Any]] = None,
                                   timeout: int = 30, retry_attempts: int = 3) -> Dict[str, Any]:
        """Execute HTTP request with retry logic"""
        
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        last_exception = None
        
        for attempt in range(retry_attempts + 1):
            try:
                async with self.session.request(
                    method=method.value,
                    url=url,
                    headers=headers,
                    params=params,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    response_data = {
                        "status_code": response.status,
                        "headers": dict(response.headers)
                    }
                    
                    # Parse response data
                    content_type = response.headers.get("content-type", "")
                    if "application/json" in content_type:
                        response_data["data"] = await response.json()
                    else:
                        response_data["data"] = await response.text()
                    
                    # Check for HTTP errors
                    if response.status >= 400:
                        raise ExternalServiceError(
                            f"HTTP {response.status}: {response_data.get('data', 'Unknown error')}",
                            service_name="HTTP Client",
                            details={"status_code": response.status, "url": url}
                        )
                    
                    return response_data
            
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                last_exception = e
                if attempt < retry_attempts:
                    wait_time = 2 ** attempt  # Exponential backoff
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    raise
        
        # If we get here, all retries failed
        raise ExternalServiceError(
            f"Request failed after {retry_attempts} attempts: {str(last_exception)}",
            service_name="HTTP Client"
        )
    
    def _update_request_stats(self, response: IntegrationResponse, response_time: float):
        """Update request statistics"""
        self.request_stats["total_requests"] += 1
        
        if response.status_code < 400:
            self.request_stats["successful_requests"] += 1
        else:
            self.request_stats["failed_requests"] += 1
        
        # Update average response time
        total_requests = self.request_stats["total_requests"]
        current_avg = self.request_stats["avg_response_time"]
        new_avg = (current_avg * (total_requests - 1) + response_time) / total_requests
        self.request_stats["avg_response_time"] = new_avg
    
    # Specific integration methods
    
    @cached(ttl=timedelta(minutes=30), key_prefix="legal_search")
    async def search_legal_database(self, query: str, jurisdiction: str = "UZ") -> Dict[str, Any]:
        """Search legal database for laws and regulations"""
        request = IntegrationRequest(
            integration_name="legal_database",
            endpoint="/search",
            method=RequestMethod.GET,
            params={"q": query, "jurisdiction": jurisdiction}
        )
        
        response = await self.make_request(request)
        return response.data
    
    @cached(ttl=timedelta(minutes=15), key_prefix="court_cases")
    async def get_court_cases(self, case_number: Optional[str] = None,
                             party_name: Optional[str] = None) -> Dict[str, Any]:
        """Get court cases information"""
        params = {}
        if case_number:
            params["case_number"] = case_number
        if party_name:
            params["party_name"] = party_name
        
        request = IntegrationRequest(
            integration_name="court_system",
            endpoint="/cases",
            method=RequestMethod.GET,
            params=params
        )
        
        response = await self.make_request(request)
        return response.data
    
    async def submit_government_form(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit form to government portal"""
        request = IntegrationRequest(
            integration_name="government_portal",
            endpoint="/forms/submit",
            method=RequestMethod.POST,
            data=form_data
        )
        
        response = await self.make_request(request, use_cache=False)
        return response.data
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from authentication service"""
        request = IntegrationRequest(
            integration_name="authentication_service",
            endpoint=f"/users/{user_id}",
            method=RequestMethod.GET
        )
        
        response = await self.make_request(request)
        return response.data
    
    async def send_notification(self, recipient: str, message: str, 
                              notification_type: str = "email") -> Dict[str, Any]:
        """Send notification via notification service"""
        request = IntegrationRequest(
            integration_name="notification_service",
            endpoint="/send",
            method=RequestMethod.POST,
            data={
                "recipient": recipient,
                "message": message,
                "type": notification_type
            }
        )
        
        response = await self.make_request(request, use_cache=False)
        return response.data
    
    async def backup_data(self, data: Dict[str, Any], backup_name: str) -> Dict[str, Any]:
        """Backup data to backup service"""
        request = IntegrationRequest(
            integration_name="backup_service",
            endpoint="/backup",
            method=RequestMethod.POST,
            data={
                "name": backup_name,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        response = await self.make_request(request, use_cache=False)
        return response.data
    
    async def track_analytics(self, event: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """Track analytics event"""
        request = IntegrationRequest(
            integration_name="analytics_service",
            endpoint="/events",
            method=RequestMethod.POST,
            data={
                "event": event,
                "properties": properties,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        response = await self.make_request(request, use_cache=False)
        return response.data
    
    async def health_check_all_integrations(self) -> Dict[str, Any]:
        """Health check all integrations"""
        results = {}
        
        for name, config in self.integrations.items():
            if not config.enabled:
                results[name] = {"status": "disabled", "response_time": 0}
                continue
            
            try:
                start_time = datetime.utcnow()
                request = IntegrationRequest(
                    integration_name=name,
                    endpoint="/health",
                    method=RequestMethod.GET
                )
                
                response = await self.make_request(request, use_cache=False)
                response_time = (datetime.utcnow() - start_time).total_seconds()
                
                results[name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "status_code": response.status_code,
                    "response_time": response_time
                }
                
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e),
                    "response_time": 0
                }
        
        return results
    
    def get_request_stats(self) -> Dict[str, Any]:
        """Get integration request statistics"""
        total_requests = self.request_stats["total_requests"]
        
        return {
            "total_requests": total_requests,
            "successful_requests": self.request_stats["successful_requests"],
            "failed_requests": self.request_stats["failed_requests"],
            "cached_requests": self.request_stats["cached_requests"],
            "success_rate": (self.request_stats["successful_requests"] / total_requests * 100) if total_requests > 0 else 0,
            "cache_hit_rate": (self.request_stats["cached_requests"] / total_requests * 100) if total_requests > 0 else 0,
            "avg_response_time": self.request_stats["avg_response_time"],
            "integrations_count": len(self.integrations),
            "enabled_integrations": len([i for i in self.integrations.values() if i.enabled])
        }
    
    def get_integration_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get all integration configurations (without sensitive data)"""
        configs = {}
        
        for name, config in self.integrations.items():
            configs[name] = {
                "name": config.name,
                "integration_type": config.integration_type.value,
                "base_url": config.base_url,
                "authentication_type": config.authentication_type.value,
                "timeout": config.timeout,
                "retry_attempts": config.retry_attempts,
                "rate_limit": config.rate_limit,
                "enabled": config.enabled,
                "has_credentials": bool(config.credentials)
            }
        
        return configs

# Global integration service instance
integration_service = IntegrationService()

# Dependency injection
def get_integration_service() -> IntegrationService:
    """Get integration service instance"""
    return integration_service
