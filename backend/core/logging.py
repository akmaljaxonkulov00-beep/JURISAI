"""
Core Logging Module - Centralized logging configuration and management
"""

import logging
import logging.handlers
import sys
import os
from typing import Optional, Dict, Any
from datetime import datetime
import json
import traceback
from pathlib import Path

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
LOG_FILE = os.getenv("LOG_FILE", "logs/jurisai.log")
LOG_MAX_SIZE = int(os.getenv("LOG_MAX_SIZE", "10485760"))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))

# Create logs directory
Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)

# Custom formatter for structured logging
class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 'msecs', 
                          'relativeCreated', 'thread', 'threadName', 'processName', 'process',
                          'getMessage', 'exc_info', 'exc_text', 'stack_info']:
                log_entry[key] = value
        
        return json.dumps(log_entry, default=str)

# Performance logging decorator
class PerformanceLogger:
    """Performance logging decorator"""
    
    def __init__(self, logger_name: str = "performance"):
        self.logger = logging.getLogger(logger_name)
    
    def __call__(self, func):
        def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            self.logger.info(f"Starting {func.__name__}", extra={
                "function": func.__name__,
                "start_time": start_time.isoformat()
            })
            
            try:
                result = func(*args, **kwargs)
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                
                self.logger.info(f"Completed {func.__name__}", extra={
                    "function": func.__name__,
                    "duration_seconds": duration,
                    "end_time": end_time.isoformat(),
                    "success": True
                })
                
                return result
            except Exception as e:
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                
                self.logger.error(f"Failed {func.__name__}", extra={
                    "function": func.__name__,
                    "duration_seconds": duration,
                    "end_time": end_time.isoformat(),
                    "success": False,
                    "error": str(e)
                })
                
                raise
        
        return wrapper

# Request logging middleware
class RequestLogger:
    """HTTP request logging middleware"""
    
    def __init__(self, logger_name: str = "requests"):
        self.logger = logging.getLogger(logger_name)
    
    def log_request(self, method: str, url: str, headers: Dict[str, str], 
                    body: Optional[str] = None):
        """Log incoming request"""
        self.logger.info(f"Request: {method} {url}", extra={
            "method": method,
            "url": url,
            "headers": headers,
            "body": body,
            "type": "request"
        })
    
    def log_response(self, method: str, url: str, status_code: int, 
                     response_time: float, response_size: int):
        """Log response"""
        self.logger.info(f"Response: {method} {url}", extra={
            "method": method,
            "url": url,
            "status_code": status_code,
            "response_time_ms": response_time * 1000,
            "response_size_bytes": response_size,
            "type": "response"
        })

# Security logging
class SecurityLogger:
    """Security event logging"""
    
    def __init__(self, logger_name: str = "security"):
        self.logger = logging.getLogger(logger_name)
    
    def log_login_attempt(self, username: str, ip_address: str, success: bool):
        """Log login attempt"""
        self.logger.info(f"Login attempt for {username}", extra={
            "username": username,
            "ip_address": ip_address,
            "success": success,
            "event_type": "login_attempt"
        })
    
    def log_permission_denied(self, user_id: str, resource: str, action: str):
        """Log permission denied"""
        self.logger.warning(f"Permission denied for user {user_id}", extra={
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "event_type": "permission_denied"
        })
    
    def log_suspicious_activity(self, user_id: str, activity: str, details: Dict[str, Any]):
        """Log suspicious activity"""
        self.logger.warning(f"Suspicious activity from user {user_id}", extra={
            "user_id": user_id,
            "activity": activity,
            "details": details,
            "event_type": "suspicious_activity"
        })

# Audit logging
class AuditLogger:
    """Audit trail logging"""
    
    def __init__(self, logger_name: str = "audit"):
        self.logger = logging.getLogger(logger_name)
    
    def log_action(self, user_id: str, action: str, resource: str, 
                   details: Optional[Dict[str, Any]] = None):
        """Log user action for audit trail"""
        self.logger.info(f"User {user_id} performed {action} on {resource}", extra={
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "details": details or {},
            "event_type": "audit",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def log_data_access(self, user_id: str, data_type: str, record_id: str):
        """Log data access"""
        self.logger.info(f"User {user_id} accessed {data_type} {record_id}", extra={
            "user_id": user_id,
            "data_type": data_type,
            "record_id": record_id,
            "event_type": "data_access"
        })
    
    def log_system_change(self, user_id: str, change_type: str, details: Dict[str, Any]):
        """Log system configuration changes"""
        self.logger.info(f"System change by {user_id}: {change_type}", extra={
            "user_id": user_id,
            "change_type": change_type,
            "details": details,
            "event_type": "system_change"
        })

# Global logger instances
performance_logger = PerformanceLogger()
request_logger = RequestLogger()
security_logger = SecurityLogger()
audit_logger = AuditLogger()

def get_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """
    Get configured logger instance
    
    Args:
        name (str): Logger name
        level (Optional[str]): Log level override
        
    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, level or LOG_LEVEL))
        console_formatter = logging.Formatter(LOG_FORMAT)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_FILE,
            maxBytes=LOG_MAX_SIZE,
            backupCount=LOG_BACKUP_COUNT
        )
        file_handler.setLevel(getattr(logging, level or LOG_LEVEL))
        file_formatter = StructuredFormatter()
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        # Set logger level
        logger.setLevel(getattr(logging, level or LOG_LEVEL))
        
        # Prevent propagation to avoid duplicate logs
        logger.propagate = False
    
    return logger

def setup_logging(level: str = "INFO", format_string: Optional[str] = None, 
                   log_file: Optional[str] = None):
    """
    Setup global logging configuration
    
    Args:
        level (str): Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string (Optional[str]): Log format string
        log_file (Optional[str]): Log file path
    """
    global LOG_LEVEL, LOG_FORMAT, LOG_FILE
    
    LOG_LEVEL = level
    LOG_FORMAT = format_string or LOG_FORMAT
    LOG_FILE = log_file or LOG_FILE
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level))
    console_formatter = logging.Formatter(LOG_FORMAT)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # Add file handler
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=LOG_MAX_SIZE,
            backupCount=LOG_BACKUP_COUNT
        )
        file_handler.setLevel(getattr(logging, level))
        file_formatter = StructuredFormatter()
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
    
    logging.info(f"Logging configured: level={level}, file={log_file}")

def get_log_stats() -> Dict[str, Any]:
    """
    Get logging statistics
    
    Returns:
        Dict[str, Any]: Logging statistics
    """
    stats = {
        "configured_loggers": len(logging.Logger.manager.loggerDict),
        "log_file": LOG_FILE,
        "log_level": LOG_LEVEL,
        "max_file_size": LOG_MAX_SIZE,
        "backup_count": LOG_BACKUP_COUNT
    }
    
    # Check if log file exists and get its size
    if os.path.exists(LOG_FILE):
        stats["current_file_size"] = os.path.getsize(LOG_FILE)
        stats["file_exists"] = True
    else:
        stats["file_exists"] = False
        stats["current_file_size"] = 0
    
    return stats

def cleanup_logs():
    """Clean up old log files"""
    try:
        log_dir = Path(LOG_FILE).parent
        for log_file in log_dir.glob("*.log.*"):
            if log_file.stat().st_size == 0:  # Remove empty log files
                log_file.unlink()
                logging.info(f"Removed empty log file: {log_file}")
    except Exception as e:
        logging.error(f"Error cleaning up logs: {e}")

# Initialize logging on module import
setup_logging()
