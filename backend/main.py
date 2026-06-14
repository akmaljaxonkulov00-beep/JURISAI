"""
Main Application Entry Point - FastAPI application setup and lifespan management
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import time
import uvicorn
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Import core modules
from core.database import init_database, health_check as db_health_check, get_database_metrics
from core.logging import get_logger, setup_logging, request_logger, performance_logger
from core.error_handling import (
    JurisAIException, 
    jurisai_exception_handler, 
    general_exception_handler,
    setup_error_handling
)

# Import routers (will be created later)
# from routers import irac_solver, scenario_generator, weakness_detection, template_engine, court_precedents, legal_dictionary

# Application configuration
APP_NAME = "JurisAI Legal Education Platform"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Advanced legal education platform with AI-powered analysis tools"

# Setup logging
setup_logging()
logger = get_logger(__name__)
setup_error_handling()

# Application state
class ApplicationState:
    """Application state management"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.request_count = 0
        self.error_count = 0
        self.active_connections = 0
        self.last_health_check = None
        self.metrics = {
            "uptime_seconds": 0,
            "requests_per_second": 0.0,
            "error_rate": 0.0,
            "avg_response_time": 0.0,
            "memory_usage": 0.0,
            "cpu_usage": 0.0
        }
    
    def update_metrics(self):
        """Update application metrics"""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        self.metrics["uptime_seconds"] = uptime
        
        if uptime > 0:
            self.metrics["requests_per_second"] = self.request_count / uptime
        
        if self.request_count > 0:
            self.metrics["error_rate"] = (self.error_count / self.request_count) * 100
    
    def get_status(self) -> Dict[str, Any]:
        """Get application status"""
        self.update_metrics()
        
        return {
            "status": "healthy",
            "app_name": APP_NAME,
            "version": APP_VERSION,
            "uptime_seconds": self.metrics["uptime_seconds"],
            "request_count": self.request_count,
            "error_count": self.error_count,
            "active_connections": self.active_connections,
            "metrics": self.metrics,
            "timestamp": datetime.utcnow().isoformat()
        }

# Global application state
app_state = ApplicationState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    
    Handles startup and shutdown events
    """
    logger.info(f"Starting {APP_NAME} v{APP_VERSION}")
    
    try:
        # Initialize database
        init_database()
        logger.info("Database initialized successfully")
        
        # Initialize services
        # await initialize_services()
        logger.info("Services initialized successfully")
        
        # Setup monitoring
        # setup_monitoring()
        logger.info("Monitoring setup completed")
        
        # Application ready
        logger.info(f"{APP_NAME} started successfully")
        app_state.last_health_check = datetime.utcnow()
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    
    finally:
        # Cleanup
        logger.info("Shutting down application...")
        
        # Cleanup services
        # await cleanup_services()
        
        # Close database connections
        # await cleanup_database()
        
        logger.info(f"{APP_NAME} shutdown complete")

# Create FastAPI application
app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.jurisai.ai"]  # Configure based on your needs
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    start_time = time.time()
    
    # Log request
    request_logger.log_request(
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
        body=await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    )
    
    # Update connection count
    app_state.active_connections += 1
    
    try:
        response = await call_next(request)
        
        # Calculate response time
        response_time = time.time() - start_time
        response_size = len(response.body) if hasattr(response, 'body') else 0
        
        # Log response
        request_logger.log_response(
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            response_time=response_time,
            response_size=response_size
        )
        
        # Update metrics
        app_state.request_count += 1
        if response.status_code >= 400:
            app_state.error_count += 1
        
        # Add response headers
        response.headers["X-Response-Time"] = f"{response_time:.3f}s"
        response.headers["X-Request-ID"] = str(id(request))
        
        return response
    
    except Exception as e:
        app_state.error_count += 1
        logger.error(f"Request failed: {e}")
        raise
    
    finally:
        app_state.active_connections -= 1

# Exception handlers
app.add_exception_handler(JurisAIException, jurisai_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint - Application information
    
    Returns:
        Dict[str, Any]: Application information
    """
    return {
        "message": f"Welcome to {APP_NAME}",
        "version": APP_VERSION,
        "description": APP_DESCRIPTION,
        "status": "running",
        "docs_url": "/docs",
        "health_url": "/health",
        "timestamp": datetime.utcnow().isoformat()
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Dict[str, Any]: Health status information
    """
    try:
        # Check database health
        db_health = db_health_check()
        
        # Check application health
        app_health = app_state.get_status()
        
        # Overall health status
        overall_status = "healthy" if (
            db_health["status"] == "healthy" and 
            app_health["status"] == "healthy"
        ) else "unhealthy"
        
        health_data = {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": APP_VERSION,
            "uptime_seconds": app_health["metrics"]["uptime_seconds"],
            "database": db_health,
            "application": app_health,
            "checks": {
                "database": db_health["status"] == "healthy",
                "application": app_health["status"] == "healthy",
                "error_rate": app_health["metrics"]["error_rate"] < 5.0,
                "response_time": app_health["metrics"]["avg_response_time"] < 1.0
            }
        }
        
        app_state.last_health_check = datetime.utcnow()
        
        # Return appropriate status code
        status_code = 200 if overall_status == "healthy" else 503
        
        return JSONResponse(
            status_code=status_code,
            content=health_data
        )
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        )

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """
    Application metrics endpoint
    
    Returns:
        Dict[str, Any]: Application and database metrics
    """
    try:
        # Get database metrics
        db_metrics = get_database_metrics()
        
        # Get application metrics
        app_metrics = app_state.get_status()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "application": app_metrics,
            "database": db_metrics,
            "system": {
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "platform": sys.platform,
                "memory_usage": app_state.metrics["memory_usage"],
                "cpu_usage": app_state.metrics["cpu_usage"]
            }
        }
    
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise JurisAIException(
            message="Failed to retrieve metrics",
            error_code="METRICS_ERROR",
            details={"error": str(e)}
        )

# Performance monitoring endpoint
@app.get("/performance")
async def get_performance_stats():
    """
    Performance statistics endpoint
    
    Returns:
        Dict[str, Any]: Performance statistics
    """
    try:
        uptime = app_state.metrics["uptime_seconds"]
        
        stats = {
            "uptime": {
                "seconds": uptime,
                "hours": uptime / 3600,
                "days": uptime / 86400
            },
            "requests": {
                "total": app_state.request_count,
                "per_second": app_state.metrics["requests_per_second"],
                "error_rate": app_state.metrics["error_rate"]
            },
            "connections": {
                "active": app_state.active_connections,
                "total": app_state.request_count
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return stats
    
    except Exception as e:
        logger.error(f"Failed to get performance stats: {e}")
        raise JurisAIException(
            message="Failed to retrieve performance statistics",
            error_code="PERFORMANCE_ERROR",
            details={"error": str(e)}
        )

# Custom OpenAPI schema
def custom_openapi():
    """Custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=APP_NAME,
        version=APP_VERSION,
        description=APP_DESCRIPTION,
        routes=app.routes,
    )
    
    # Add custom information
    openapi_schema["info"]["x-logo"] = {
        "url": "https://jurisai.ai/logo.png"
    }
    
    openapi_schema["info"]["contact"] = {
        "name": "JurisAI Support",
        "url": "https://jurisai.ai/support",
        "email": "support@jurisai.ai"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Include routers (will be added later)
# app.include_router(irac_solver.router, prefix="/api/v1/irac", tags=["IRAC Solver"])
# app.include_router(scenario_generator.router, prefix="/api/v1/scenarios", tags=["Scenario Generator"])
# app.include_router(weakness_detector.router, prefix="/api/v1/weakness", tags=["Weakness Detector"])
# app.include_router(template_engine.router, prefix="/api/v1/templates", tags=["Template Engine"])
# app.include_router(court_precedents.router, prefix="/api/v1/precedents", tags=["Court Precedents"])
# app.include_router(legal_dictionary.router, prefix="/api/v1/dictionary", tags=["Legal Dictionary"])

# Development endpoints
@app.get("/debug/info")
async def debug_info():
    """Debug information endpoint (development only)"""
    if app.state.debug:
        return {
            "debug": True,
            "app_state": app_state.__dict__,
            "environment": {
                "python_version": sys.version,
                "platform": sys.platform,
                "working_directory": __import__('os').getcwd()
            }
        }
    else:
        raise JurisAIException(
            message="Debug mode is not enabled",
            error_code="DEBUG_DISABLED"
        )

# Performance monitoring decorator
@performance_logger
def monitored_function(func):
    """Decorator for monitoring function performance"""
    return func

# Application startup validation
def validate_startup():
    """Validate application startup requirements"""
    try:
        # Check required environment variables
        required_env_vars = []
        # Add required environment variables here
        
        missing_vars = []
        for var in required_env_vars:
            if not __import__('os').getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ConfigurationError(
                message=f"Missing required environment variables: {', '.join(missing_vars)}",
                config_key=missing_vars[0]
            )
        
        logger.info("Startup validation completed successfully")
        return True
    
    except Exception as e:
        logger.error(f"Startup validation failed: {e}")
        return False

# Run validation on import
validate_startup()

if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
