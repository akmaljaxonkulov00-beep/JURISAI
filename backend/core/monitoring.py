"""
Monitoring and Observability Module
Integrates Sentry for error tracking and performance monitoring
"""

import logging
from functools import wraps
from typing import Optional, Dict, Any
import time

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


def init_sentry():
    """Initialize Sentry monitoring"""
    if not SENTRY_AVAILABLE:
        logger.warning("Sentry SDK not installed. Monitoring disabled.")
        return
    
    if not settings.SENTRY_DSN:
        logger.info("Sentry DSN not configured. Monitoring disabled.")
        return
    
    try:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                ),
            ],
            before_send=before_send_handler,
            release=f"{settings.APP_NAME}@{settings.APP_VERSION}",
        )
        logger.info("Sentry monitoring initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def before_send_handler(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Filter and modify events before sending to Sentry"""
    
    # Don't send 404 errors
    if event.get('exception'):
        exc_type = event['exception'].get('type')
        if exc_type == 'HTTPException' and event.get('contexts', {}).get('response', {}).get('status_code') == 404:
            return None
    
    # Sanitize sensitive data
    if 'request' in event:
        request = event['request']
        
        # Remove sensitive headers
        if 'headers' in request:
            sensitive_headers = ['authorization', 'cookie', 'x-api-key']
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[REDACTED]'
        
        # Remove sensitive query params
        if 'query_string' in request:
            sensitive_params = ['token', 'api_key', 'password']
            for param in sensitive_params:
                if param in request['query_string']:
                    request['query_string'] = request['query_string'].replace(
                        request['query_string'],
                        '[REDACTED]'
                    )
    
    return event


def capture_exception(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    level: str = "error"
):
    """Capture exception and send to Sentry"""
    if SENTRY_AVAILABLE and settings.SENTRY_DSN:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            
            scope.level = level
            sentry_sdk.capture_exception(error)
    
    # Also log locally
    logger.error(f"Exception captured: {error}", exc_info=True, extra=context or {})


def capture_message(
    message: str,
    level: str = "info",
    context: Optional[Dict[str, Any]] = None
):
    """Capture message and send to Sentry"""
    if SENTRY_AVAILABLE and settings.SENTRY_DSN:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            
            sentry_sdk.capture_message(message, level=level)
    
    # Also log locally
    log_method = getattr(logger, level, logger.info)
    log_method(message, extra=context or {})


def start_transaction(name: str, op: str = "function"):
    """Start performance transaction"""
    if SENTRY_AVAILABLE and settings.SENTRY_DSN:
        return sentry_sdk.start_transaction(name=name, op=op)
    return None


def monitor_performance(operation_name: str):
    """
    Decorator to monitor function performance
    
    Usage:
        @monitor_performance("user.get")
        async def get_user(user_id: str):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            transaction = start_transaction(
                name=operation_name,
                op="function"
            )
            
            try:
                result = await func(*args, **kwargs)
                
                if transaction:
                    transaction.set_status("ok")
                
                return result
            
            except Exception as e:
                if transaction:
                    transaction.set_status("internal_error")
                
                capture_exception(
                    e,
                    context={
                        "operation": operation_name,
                        "args": str(args),
                        "kwargs": str(kwargs),
                    }
                )
                raise
            
            finally:
                duration = time.time() - start_time
                
                if transaction:
                    transaction.finish()
                
                # Log performance metrics
                logger.info(
                    f"Operation completed: {operation_name}",
                    extra={
                        "operation": operation_name,
                        "duration_seconds": duration,
                    }
                )
        
        return wrapper
    return decorator


class MetricsCollector:
    """Collect application metrics"""
    
    def __init__(self):
        self.metrics: Dict[str, Any] = {
            "requests": {},
            "errors": {},
            "performance": {},
        }
    
    def record_request(self, endpoint: str, method: str, status_code: int, duration: float):
        """Record API request metrics"""
        key = f"{method}:{endpoint}"
        
        if key not in self.metrics["requests"]:
            self.metrics["requests"][key] = {
                "count": 0,
                "total_duration": 0.0,
                "status_codes": {},
            }
        
        self.metrics["requests"][key]["count"] += 1
        self.metrics["requests"][key]["total_duration"] += duration
        
        status_key = str(status_code)
        if status_key not in self.metrics["requests"][key]["status_codes"]:
            self.metrics["requests"][key]["status_codes"][status_key] = 0
        self.metrics["requests"][key]["status_codes"][status_key] += 1
    
    def record_error(self, error_type: str, endpoint: str):
        """Record error metrics"""
        key = f"{error_type}:{endpoint}"
        
        if key not in self.metrics["errors"]:
            self.metrics["errors"][key] = 0
        
        self.metrics["errors"][key] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics"""
        # Calculate averages
        for key, data in self.metrics["requests"].items():
            if data["count"] > 0:
                data["avg_duration"] = data["total_duration"] / data["count"]
        
        return self.metrics
    
    def reset_metrics(self):
        """Reset all metrics"""
        self.metrics = {
            "requests": {},
            "errors": {},
            "performance": {},
        }


# Global metrics collector
metrics_collector = MetricsCollector()
