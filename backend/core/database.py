"""
Core Database Module - Database session management and metrics
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import time
import threading
from contextlib import contextmanager

# Database configuration
DATABASE_URL = "sqlite:///./jurisai.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model
Base = declarative_base()

# Database metrics
db_metrics = {
    "total_connections": 0,
    "active_connections": 0,
    "query_count": 0,
    "avg_response_time": 0.0,
    "error_count": 0,
    "last_reset": time.time()
}

# Thread lock for metrics
metrics_lock = threading.Lock()

def get_db_session() -> Session:
    """
    Get database session
    
    Returns:
        Session: Database session object
    """
    session = SessionLocal()
    
    # Update metrics
    with metrics_lock:
        db_metrics["total_connections"] += 1
        db_metrics["active_connections"] += 1
    
    return session

def get_db() -> Session:
    """
    FastAPI dependency for database session
    
    Yields:
        Session: Database session object
    """
    session = get_db_session()
    try:
        yield session
    except Exception as e:
        session.rollback()
        db_metrics["error_count"] += 1
        raise e
    finally:
        session.close()
        with metrics_lock:
            db_metrics["active_connections"] -= 1

@contextmanager
def get_db_context():
    """
    Context manager for database session
    
    Yields:
        Session: Database session object
    """
    session = get_db_session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_database_metrics() -> Dict[str, Any]:
    """
    Get database performance metrics
    
    Returns:
        Dict[str, Any]: Database metrics including connections, queries, response times
    """
    with metrics_lock:
        current_time = time.time()
        uptime = current_time - db_metrics["last_reset"]
        
        metrics = {
            "total_connections": db_metrics["total_connections"],
            "active_connections": db_metrics["active_connections"],
            "query_count": db_metrics["query_count"],
            "avg_response_time": db_metrics["avg_response_time"],
            "error_count": db_metrics["error_count"],
            "uptime_seconds": uptime,
            "connections_per_second": db_metrics["total_connections"] / uptime if uptime > 0 else 0,
            "error_rate": db_metrics["error_count"] / max(db_metrics["query_count"], 1) * 100
        }
    
    return metrics

def reset_database_metrics():
    """Reset database metrics"""
    with metrics_lock:
        db_metrics.update({
            "total_connections": 0,
            "active_connections": 0,
            "query_count": 0,
            "avg_response_time": 0.0,
            "error_count": 0,
            "last_reset": time.time()
        })

def update_query_metrics(response_time: float, success: bool = True):
    """
    Update query performance metrics
    
    Args:
        response_time (float): Query response time in seconds
        success (bool): Whether query was successful
    """
    with metrics_lock:
        db_metrics["query_count"] += 1
        
        # Update average response time
        total_queries = db_metrics["query_count"]
        current_avg = db_metrics["avg_response_time"]
        new_avg = (current_avg * (total_queries - 1) + response_time) / total_queries
        db_metrics["avg_response_time"] = new_avg
        
        if not success:
            db_metrics["error_count"] += 1

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)

def health_check() -> Dict[str, Any]:
    """
    Database health check
    
    Returns:
        Dict[str, Any]: Health status and metrics
    """
    try:
        # Test database connection
        with get_db_context() as session:
            session.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database_url": DATABASE_URL,
            "metrics": get_database_metrics()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "metrics": get_database_metrics()
        }

# Initialize database
def init_database():
    """Initialize database with tables and default data"""
    try:
        create_tables()
        logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
        raise

# Database connection pool management
class DatabasePool:
    """Database connection pool manager"""
    
    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.available_connections = max_connections
        self.lock = threading.Lock()
    
    def get_connection(self) -> bool:
        """Get connection from pool"""
        with self.lock:
            if self.available_connections > 0:
                self.available_connections -= 1
                return True
            return False
    
    def release_connection(self):
        """Release connection back to pool"""
        with self.lock:
            if self.available_connections < self.max_connections:
                self.available_connections += 1
    
    def get_pool_status(self) -> Dict[str, int]:
        """Get pool status"""
        with self.lock:
            return {
                "max_connections": self.max_connections,
                "available_connections": self.available_connections,
                "used_connections": self.max_connections - self.available_connections
            }

# Global pool instance
db_pool = DatabasePool()
