"""
Core Error Handling Module - Centralized error handling and exception management
"""

import logging
import traceback
import sys
from typing import Optional, Dict, Any, Callable, Type, Union
from functools import wraps
from datetime import datetime
import json
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

# Custom exceptions
class JurisAIException(Exception):
    """Base exception for JurisAI application"""
    
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code or "JURISAI_ERROR"
        self.details = details or {}
        self.timestamp = datetime.utcnow()
        super().__init__(self.message)

class DatabaseError(JurisAIException):
    """Database related errors"""
    
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(message, "DATABASE_ERROR", details)

class ValidationError(JurisAIException):
    """Validation related errors"""
    
    def __init__(self, message: str, field: str = None, details: Dict[str, Any] = None):
        super().__init__(message, "VALIDATION_ERROR", details)
        self.field = field

class AuthenticationError(JurisAIException):
    """Authentication related errors"""
    
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(message, "AUTHENTICATION_ERROR", details)

class AuthorizationError(JurisAIException):
    """Authorization related errors"""
    
    def __init__(self, message: str, resource: str = None, details: Dict[str, Any] = None):
        super().__init__(message, "AUTHORIZATION_ERROR", details)
        self.resource = resource

class BusinessLogicError(JurisAIException):
    """Business logic related errors"""
    
    def __init__(self, message: str, business_rule: str = None, details: Dict[str, Any] = None):
        super().__init__(message, "BUSINESS_LOGIC_ERROR", details)
        self.business_rule = business_rule

class ExternalServiceError(JurisAIException):
    """External service related errors"""
    
    def __init__(self, message: str, service_name: str = None, details: Dict[str, Any] = None):
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)
        self.service_name = service_name

class ConfigurationError(JurisAIException):
    """Configuration related errors"""
    
    def __init__(self, message: str, config_key: str = None, details: Dict[str, Any] = None):
        super().__init__(message, "CONFIGURATION_ERROR", details)
        self.config_key = config_key

# Error handling decorator
def handle_errors(
    default_error_code: str = "INTERNAL_SERVER_ERROR",
    log_errors: bool = True,
    reraise: bool = False,
    return_on_error: Any = None
):
    """
    Error handling decorator for functions
    
    Args:
        default_error_code (str): Default error code for unhandled exceptions
        log_errors (bool): Whether to log errors
        reraise (bool): Whether to reraise exceptions after handling
        return_on_error (Any): Value to return on error (if not reraising)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except JurisAIException as e:
                if log_errors:
                    logger = logging.getLogger(func.__module__)
                    logger.error(f"JurisAIException in {func.__name__}: {e.message}", extra={
                        "error_code": e.error_code,
                        "details": e.details,
                        "timestamp": e.timestamp.isoformat(),
                        "function": func.__name__,
                        "module": func.__module__
                    })
                
                if reraise:
                    raise
                
                return return_on_error
            
            except Exception as e:
                if log_errors:
                    logger = logging.getLogger(func.__module__)
                    logger.error(f"Unhandled exception in {func.__name__}: {str(e)}", extra={
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "traceback": traceback.format_exc(),
                        "function": func.__name__,
                        "module": func.__module__
                    })
                
                if reraise:
                    raise JurisAIException(
                        message=str(e),
                        error_code=default_error_code,
                        details={
                            "original_error": type(e).__name__,
                            "traceback": traceback.format_exc()
                        }
                    )
                
                return return_on_error
        
        return wrapper
    return decorator

# Async error handling decorator
def handle_async_errors(
    default_error_code: str = "INTERNAL_SERVER_ERROR",
    log_errors: bool = True,
    reraise: bool = False,
    return_on_error: Any = None
):
    """
    Async error handling decorator for functions
    
    Args:
        default_error_code (str): Default error code for unhandled exceptions
        log_errors (bool): Whether to log errors
        reraise (bool): Whether to reraise exceptions after handling
        return_on_error (Any): Value to return on error (if not reraising)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except JurisAIException as e:
                if log_errors:
                    logger = logging.getLogger(func.__module__)
                    logger.error(f"JurisAIException in {func.__name__}: {e.message}", extra={
                        "error_code": e.error_code,
                        "details": e.details,
                        "timestamp": e.timestamp.isoformat(),
                        "function": func.__name__,
                        "module": func.__module__
                    })
                
                if reraise:
                    raise
                
                return return_on_error
            
            except Exception as e:
                if log_errors:
                    logger = logging.getLogger(func.__module__)
                    logger.error(f"Unhandled exception in {func.__name__}: {str(e)}", extra={
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "traceback": traceback.format_exc(),
                        "function": func.__name__,
                        "module": func.__module__
                    })
                
                if reraise:
                    raise JurisAIException(
                        message=str(e),
                        error_code=default_error_code,
                        details={
                            "original_error": type(e).__name__,
                            "traceback": traceback.format_exc()
                        }
                    )
                
                return return_on_error
        
        return wrapper
    return decorator

# Error response formatter
def format_error_response(
    error: Union[JurisAIException, Exception],
    include_traceback: bool = False
) -> Dict[str, Any]:
    """
    Format error for API response
    
    Args:
        error (Union[JurisAIException, Exception]): Exception to format
        include_traceback (bool): Whether to include traceback in response
        
    Returns:
        Dict[str, Any]: Formatted error response
    """
    if isinstance(error, JurisAIException):
        response = {
            "error": True,
            "error_code": error.error_code,
            "message": error.message,
            "details": error.details,
            "timestamp": error.timestamp.isoformat()
        }
    else:
        response = {
            "error": True,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": str(error),
            "details": {
                "original_error": type(error).__name__
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    if include_traceback:
        response["traceback"] = traceback.format_exc()
    
    return response

# FastAPI exception handler
async def jurisai_exception_handler(request: Request, exc: JurisAIException) -> JSONResponse:
    """
    FastAPI exception handler for JurisAI exceptions
    
    Args:
        request (Request): FastAPI request object
        exc (JurisAIException): JurisAI exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    logger = logging.getLogger("api_errors")
    logger.error(f"API Error: {exc.message}", extra={
        "error_code": exc.error_code,
        "details": exc.details,
        "path": request.url.path,
        "method": request.method,
        "client_ip": request.client.host if request.client else None
    })
    
    status_code = get_status_code_for_error(exc.error_code)
    return JSONResponse(
        status_code=status_code,
        content=format_error_response(exc)
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    FastAPI exception handler for general exceptions
    
    Args:
        request (Request): FastAPI request object
        exc (Exception): General exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    logger = logging.getLogger("api_errors")
    logger.error(f"Unhandled API Error: {str(exc)}", extra={
        "error_type": type(exc).__name__,
        "path": request.url.path,
        "method": request.method,
        "client_ip": request.client.host if request.client else None,
        "traceback": traceback.format_exc()
    })
    
    jurisai_exc = JurisAIException(
        message="An unexpected error occurred",
        error_code="INTERNAL_SERVER_ERROR",
        details={
            "original_error": type(exc).__name__
        }
    )
    
    return JSONResponse(
        status_code=500,
        content=format_error_response(jurisai_exc)
    )

# Status code mapping
ERROR_STATUS_CODES = {
    "VALIDATION_ERROR": 400,
    "AUTHENTICATION_ERROR": 401,
    "AUTHORIZATION_ERROR": 403,
    "NOT_FOUND": 404,
    "BUSINESS_LOGIC_ERROR": 422,
    "EXTERNAL_SERVICE_ERROR": 502,
    "DATABASE_ERROR": 500,
    "CONFIGURATION_ERROR": 500,
    "INTERNAL_SERVER_ERROR": 500
}

def get_status_code_for_error(error_code: str) -> int:
    """
    Get HTTP status code for error code
    
    Args:
        error_code (str): Error code
        
    Returns:
        int: HTTP status code
    """
    return ERROR_STATUS_CODES.get(error_code, 500)

# Error context manager
class ErrorContext:
    """Context manager for error handling with context"""
    
    def __init__(self, operation: str, context: Dict[str, Any] = None):
        self.operation = operation
        self.context = context or {}
        self.logger = logging.getLogger("error_context")
    
    def __enter__(self):
        self.logger.info(f"Starting operation: {self.operation}", extra={
            "operation": self.operation,
            "context": self.context,
            "status": "starting"
        })
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.logger.info(f"Completed operation: {self.operation}", extra={
                "operation": self.operation,
                "context": self.context,
                "status": "completed"
            })
        else:
            self.logger.error(f"Failed operation: {self.operation}", extra={
                "operation": self.operation,
                "context": self.context,
                "status": "failed",
                "error_type": exc_type.__name__ if exc_type else None,
                "error_message": str(exc_val) if exc_val else None
            })
        
        return False  # Don't suppress exceptions

# Retry mechanism
def retry_on_error(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """
    Retry decorator for functions that might fail
    
    Args:
        max_retries (int): Maximum number of retries
        delay (float): Initial delay between retries
        backoff_factor (float): Backoff multiplier for delay
        exceptions (tuple): Exceptions to retry on
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = logging.getLogger(func.__module__)
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries} retries", extra={
                            "function": func.__name__,
                            "attempts": attempt + 1,
                            "error": str(e)
                        })
                        raise
                    
                    wait_time = delay * (backoff_factor ** attempt)
                    logger.warning(f"Function {func.__name__} failed, retrying in {wait_time}s", extra={
                        "function": func.__name__,
                        "attempt": attempt + 1,
                        "max_retries": max_retries,
                        "error": str(e),
                        "retry_delay": wait_time
                    })
                    
                    import time
                    time.sleep(wait_time)
        
        return wrapper
    return decorator

# Error reporting
def report_error(error: Union[JurisAIException, Exception], context: Dict[str, Any] = None):
    """
    Report error for monitoring and analysis
    
    Args:
        error (Union[JurisAIException, Exception]): Error to report
        context (Dict[str, Any]): Additional context information
    """
    logger = logging.getLogger("error_reporting")
    
    error_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
        "context": context or {}
    }
    
    if isinstance(error, JurisAIException):
        error_data.update({
            "error_code": error.error_code,
            "details": error.details
        })
    else:
        error_data["traceback"] = traceback.format_exc()
    
    logger.error("Error reported", extra=error_data)

# Initialize error handling
def setup_error_handling():
    """Setup error handling configuration"""
    # Configure logging for errors
    error_logger = logging.getLogger("error_handling")
    error_logger.setLevel(logging.ERROR)
    
    # Setup error reporting
    logging.info("Error handling configured")
